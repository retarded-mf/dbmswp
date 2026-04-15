const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==== PRODUCTS ====
app.get('/products', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.*, v.company_name as vendor_name, c.name as category_name
            FROM Product p
            JOIN Vendor v ON p.vendor_id = v.id
            JOIN Category c ON p.category_id = c.id
        `);
        res.json(rows);
    } catch (e) {
        res.status(500).json({error: e.message});
    }
});

app.post('/products', async (req, res) => {
    const { vendor_id, category_id, name, price, stock, emoji } = req.body;
    try {
        const [result] = await db.query(
            "INSERT INTO Product (vendor_id, category_id, name, price, stock, emoji) VALUES (?, ?, ?, ?, ?, ?)",
            [vendor_id, category_id, name, price, stock, emoji]
        );
        res.json({ success: true, id: result.insertId });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/products/:id', async (req, res) => {
    const { active, stock } = req.body;
    try {
        if(active !== undefined) {
             await db.query("UPDATE Product SET active=? WHERE id=?", [active, req.params.id]);
        }
        if(stock !== undefined) {
             await db.query("UPDATE Product SET stock=? WHERE id=?", [stock, req.params.id]);
        }
        res.json({success: true});
    } catch(e) {
        res.status(500).json({error: e.message});
    }
});

app.delete('/products/:id', async (req, res) => {
    try {
        await db.query("DELETE FROM Product WHERE id=?", [req.params.id]);
        res.json({success:true});
    } catch(e){
        res.status(500).json({error:e.message});
    }
});

// ==== ORDERS ====
app.get('/orders', async (req, res) => {
    try {
        const [orders] = await db.query(`
            SELECT o.id as base_order_id, o.status as order_status, o.total_amount, o.created_at, 
                   oi.id as item_id, oi.order_id, oi.product_id, p.name as product_name, 
                   oi.quantity, oi.status as item_status, oi.vendor_id
            FROM \`Order\` o
            JOIN OrderItem oi ON o.id = oi.order_id
            JOIN Product p ON oi.product_id = p.id
            ORDER BY o.created_at DESC
        `);
        res.json(orders);
    } catch(e) {
        res.status(500).json({error: e.message});
    }
});

app.post('/orders', async (req, res) => {
    const { user_id, cart_items } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        let total_amount = 0;
        cart_items.forEach(item => total_amount += (item.price * item.quantity));

        const [orderResult] = await connection.query(
            "INSERT INTO \`Order\` (user_id, total_amount) VALUES (?, ?)", 
            [user_id, total_amount]
        );
        const orderId = orderResult.insertId;

        for (const item of cart_items) {
            // Check stock
            const [productRows] = await connection.query("SELECT stock FROM Product WHERE id = ? FOR UPDATE", [item.product_id]);
            if(productRows[0].stock < item.quantity) {
                throw new Error("Not enough stock for product " + item.product_id);
            }
            await connection.query("UPDATE Product SET stock = stock - ? WHERE id = ?", [item.quantity, item.product_id]);
            
            // Insert order item
            const [itemRes] = await connection.query(
                "INSERT INTO OrderItem (order_id, product_id, quantity, price_at_time, vendor_id) VALUES (?, ?, ?, ?, ?)",
                [orderId, item.product_id, item.quantity, item.price, item.vendor_id]
            );

            // Calculate Commission
            const [vendorRows] = await connection.query("SELECT commission_rate FROM Vendor WHERE id = ?", [item.vendor_id]);
            let rate = vendorRows[0]?.commission_rate || 12;
            let commissionAmount = (item.price * item.quantity * rate) / 100;
            
            await connection.query(
                "INSERT INTO CommissionRecord (order_item_id, vendor_id, amount) VALUES (?, ?, ?)",
                [itemRes.insertId, item.vendor_id, commissionAmount]
            );
        }

        await connection.commit();
        res.json({success: true, orderId});
    } catch(e) {
        await connection.rollback();
        res.status(500).json({error: e.message});
    } finally {
        connection.release();
    }
});

app.put('/orders/:id/status', async (req, res) => {
    const { type, status } = req.body;
    try {
        if (type === 'item') {
            await db.query("UPDATE OrderItem SET status=? WHERE id=?", [status, req.params.id]);
        } else {
            await db.query("UPDATE \`Order\` SET status=? WHERE id=?", [status, req.params.id]);
        }
        res.json({success:true});
    } catch(e) {
         res.status(500).json({error:e.message});
    }
});

// ==== VENDORS ====
app.get('/vendors', async (req, res) => {
    try {
       const [rows] = await db.query("SELECT * FROM Vendor");
       res.json(rows);
    } catch(e) { res.status(500).json({error:e.message}); }
});

app.put('/vendors/:id/approve', async (req, res) => {
    const { status } = req.body; 
    try {
        await db.query("UPDATE Vendor SET status=? WHERE id=?", [status, req.params.id]);
        res.json({success: true});
    } catch(e) { res.status(500).json({error:e.message}); }
});

app.put('/admin/settings/commission', async (req, res) => {
    const { rate } = req.body;
    try {
        await db.query("UPDATE Vendor SET commission_rate=?", [rate]);
        res.json({success: true});
    } catch(e) { res.status(500).json({error:e.message}); }
});

// ==== ADMIN/STATISTICS ====
app.get('/admin/transactions', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                cr.id, 
                oi.order_id, 
                v.company_name as vendor, 
                (oi.price_at_time * oi.quantity) as amount, 
                cr.amount as commission,
                ((oi.price_at_time * oi.quantity) - cr.amount) as payout,
                o.status
            FROM CommissionRecord cr
            JOIN OrderItem oi ON cr.order_item_id = oi.id
            JOIN Vendor v ON cr.vendor_id = v.id
            JOIN \`Order\` o ON oi.order_id = o.id
            ORDER BY o.created_at DESC
        `);
        res.json(rows);
    } catch(e) { res.status(500).json({error:e.message}); }
});

app.get('/vendor/:id/dashboard', async (req, res) => {
    try {
       const [vendorInfo] = await db.query("SELECT * FROM Vendor WHERE id=?", [req.params.id]);
       if(vendorInfo[0].status !== 'Approved') {
           return res.json({ approved: false });
       }

       const [salesRows] = await db.query(`
           SELECT (oi.price_at_time * oi.quantity) as total_revenue, c.amount as commission
           FROM OrderItem oi
           LEFT JOIN CommissionRecord c ON oi.id = c.order_item_id
           WHERE oi.vendor_id = ?
       `, [req.params.id]);

       let revenue = 0, commission = 0;
       salesRows.forEach(r => {
           revenue += Number(r.total_revenue) || 0;
           commission += Number(r.commission) || 0;
       });

       const [dailySales] = await db.query(`
           SELECT DATE(o.created_at) as date, SUM(oi.price_at_time * oi.quantity) as daily_total
           FROM OrderItem oi
           JOIN \`Order\` o ON oi.order_id = o.id
           WHERE oi.vendor_id = ? AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
           GROUP BY DATE(o.created_at)
           ORDER BY date ASC
       `, [req.params.id]);

       res.json({
           approved: true,
           revenue,
           orders: salesRows.length,
           commission,
           netPayout: revenue - commission,
           chartData: dailySales
       });

    } catch(e) {res.status(500).json({error:e.message});}
});

app.get('/categories', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM Category");
        res.json(rows);
    } catch(e) {res.status(500).json({error:e.message});}
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log('Server running on http://localhost:' + PORT);
});
