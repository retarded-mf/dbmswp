const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");

const app = express();
const publicPath = path.join(__dirname, "public");

app.use(cors());
app.use(express.json());
app.use(express.static(publicPath));

app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

app.get("/products", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         p.product_id,
         p.name,
         p.price,
         p.stock,
         p.status,
         p.status AS active,
         p.vendor_id,
         p.category_id,
         p.project_type_id,
         p.difficulty_id,
         v.store_name AS vendor_name,
         c.category_name AS category_name,
         pt.type_name,
         d.level
       FROM Product p
       JOIN Vendor v ON p.vendor_id = v.vendor_id
       JOIN Category c ON p.category_id = c.category_id
       LEFT JOIN ProjectType pt ON p.project_type_id = pt.project_type_id
       LEFT JOIN DifficultyLevel d ON p.difficulty_id = d.difficulty_id
       ORDER BY p.product_id DESC`
    );

    const products = rows.map((row) => ({
      id: row.product_id,
      ...row
    }));

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/products", async (req, res) => {
  const {
    name,
    price,
    stock,
    vendor_id,
    category_id,
    project_type_id,
    difficulty_id,
    status
  } = req.body;

  if (!name || price === undefined || stock === undefined || !vendor_id || !category_id) {
    return res.status(400).json({
      error: "name, price, stock, vendor_id and category_id are required"
    });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO Product
       (name, price, stock, status, vendor_id, category_id, project_type_id, difficulty_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        price,
        stock,
        status === undefined ? true : status,
        vendor_id,
        category_id,
        project_type_id || null,
        difficulty_id || null
      ]
    );

    res.status(201).json({
      success: true,
      product_id: result.insertId,
      id: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/products/:id", async (req, res) => {
  const productId = req.params.id;
  const {
    name,
    price,
    stock,
    status,
    active,
    category_id,
    project_type_id,
    difficulty_id
  } = req.body;

  const fields = [];
  const values = [];

  if (name !== undefined) {
    fields.push("name = ?");
    values.push(name);
  }
  if (price !== undefined) {
    fields.push("price = ?");
    values.push(price);
  }
  if (stock !== undefined) {
    fields.push("stock = ?");
    values.push(stock);
  }
  if (status !== undefined) {
    fields.push("status = ?");
    values.push(status);
  } else if (active !== undefined) {
    fields.push("status = ?");
    values.push(active);
  }
  if (category_id !== undefined) {
    fields.push("category_id = ?");
    values.push(category_id);
  }
  if (project_type_id !== undefined) {
    fields.push("project_type_id = ?");
    values.push(project_type_id);
  }
  if (difficulty_id !== undefined) {
    fields.push("difficulty_id = ?");
    values.push(difficulty_id);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: "No fields provided for update" });
  }

  values.push(productId);

  try {
    const [result] = await db.query(
      `UPDATE Product SET ${fields.join(", ")} WHERE product_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/products/:id", async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM Product WHERE product_id = ?", [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/orders", async (req, res) => {
  const { user_id, cart_items } = req.body;

  if (!user_id || !Array.isArray(cart_items) || cart_items.length === 0) {
    return res.status(400).json({ error: "user_id and cart_items are required" });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    let totalAmount = 0;
    const preparedItems = [];

    for (const item of cart_items) {
      const productId = Number(item.product_id);
      const quantity = Number(item.quantity);

      if (!productId || !quantity || quantity <= 0) {
        throw new Error("Each cart item must have valid product_id and quantity");
      }

      const [productRows] = await connection.query(
        `SELECT product_id, name, price, stock, vendor_id
         FROM Product
         WHERE product_id = ? AND status = TRUE
         FOR UPDATE`,
        [productId]
      );

      if (productRows.length === 0) {
        throw new Error(`Product not found: ${productId}`);
      }

      const product = productRows[0];

      if (product.stock < quantity) {
        throw new Error(`Not enough stock for product: ${product.name}`);
      }

      const price = item.price !== undefined ? Number(item.price) : Number(product.price);
      totalAmount += price * quantity;

      preparedItems.push({
        product_id: productId,
        vendor_id: product.vendor_id,
        quantity,
        price
      });
    }

    const [orderResult] = await connection.query(
      `INSERT INTO Orders (user_id, status, total_amount)
       VALUES (?, ?, ?)`,
      [user_id, "Placed", totalAmount]
    );

    const orderId = orderResult.insertId;
    const commissionMap = new Map();

    for (const item of preparedItems) {
      await connection.query(
        `INSERT INTO OrderItem (order_id, product_id, quantity, price)
         VALUES (?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, item.price]
      );

      await connection.query(
        "UPDATE Product SET stock = stock - ? WHERE product_id = ?",
        [item.quantity, item.product_id]
      );

      const commissionAmount = item.price * item.quantity * 0.12;
      const existingAmount = commissionMap.get(item.vendor_id) || 0;
      commissionMap.set(item.vendor_id, existingAmount + commissionAmount);
    }

    for (const [vendorId, commissionAmount] of commissionMap.entries()) {
      await connection.query(
        `INSERT INTO CommissionRecord (order_id, vendor_id, commission_amount, commission_rate)
         VALUES (?, ?, ?, ?)`,
        [orderId, vendorId, commissionAmount, 12]
      );
    }

    await connection.commit();
    res.status(201).json({ success: true, order_id: orderId });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

app.get("/orders", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         o.order_id,
         o.user_id,
         o.order_date,
         o.status AS order_status,
         o.total_amount,
         oi.order_item_id,
         oi.order_item_id AS item_id,
         oi.product_id,
         p.name AS product_name,
         p.vendor_id,
         v.store_name AS vendor_name,
         oi.quantity,
         oi.price,
         oi.status AS item_status
       FROM Orders o
       JOIN OrderItem oi ON o.order_id = oi.order_id
       JOIN Product p ON oi.product_id = p.product_id
       JOIN Vendor v ON p.vendor_id = v.vendor_id
       ORDER BY o.order_date DESC, oi.order_item_id DESC`
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



app.put("/orders/:id/status", async (req, res) => {
  const { status, type } = req.body;

  if (!status) {
    return res.status(400).json({ error: "status is required" });
  }

  try {
    if (type === "item") {
      const [result] = await db.query(
        "UPDATE OrderItem SET status = ? WHERE order_item_id = ?",
        [status, req.params.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Order item not found" });
      }

      return res.json({ success: true });
    }

    const [result] = await db.query(
      "UPDATE Orders SET status = ? WHERE order_id = ?",
      [status, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/vendors", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         vendor_id,
         user_id,
         store_name,
         store_name AS company_name,
         vendor_type,
         approval_status
       FROM Vendor
       ORDER BY vendor_id ASC`
    );

    res.json(
      rows.map((row) => ({
        ...row,
        status: row.approval_status ? "Approved" : "Pending"
      }))
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/vendors/:id/approve", async (req, res) => {
  const { approval_status, status } = req.body;

  let finalStatus;
  if (approval_status !== undefined) {
    finalStatus = approval_status ? 1 : 0;
  } else if (status !== undefined) {
    finalStatus = String(status).toLowerCase() === "approved" ? 1 : 0;
  } else {
    return res.status(400).json({ error: "approval_status or status is required" });
  }

  try {
    const [result] = await db.query(
      "UPDATE Vendor SET approval_status = ? WHERE vendor_id = ?",
      [finalStatus, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/admin/transactions", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         cr.commission_id,
         cr.order_id,
         cr.vendor_id,
         v.store_name AS vendor_name,
         v.store_name AS vendor,
         o.total_amount AS amount,
         cr.commission_amount AS commission,
         (o.total_amount - cr.commission_amount) AS payout,
         cr.commission_rate,
         o.status AS order_status,
         o.order_date
       FROM CommissionRecord cr
       JOIN Orders o ON cr.order_id = o.order_id
       JOIN Vendor v ON cr.vendor_id = v.vendor_id
       ORDER BY cr.commission_id DESC`
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/admin/commission", async (req, res) => {
  const { rate } = req.body;

  if (rate === undefined) {
    return res.status(400).json({ error: "rate is required" });
  }

  try {
    const [result] = await db.query(
      "UPDATE CommissionRecord SET commission_rate = ?",
      [rate]
    );

    res.json({
      success: true,
      updated_rows: result.affectedRows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/admin/settings/commission", async (req, res) => {
  const { rate } = req.body;

  if (rate === undefined) {
    return res.status(400).json({ error: "rate is required" });
  }

  try {
    const [result] = await db.query(
      "UPDATE CommissionRecord SET commission_rate = ?",
      [rate]
    );

    res.json({
      success: true,
      updated_rows: result.affectedRows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/categories", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM Category ORDER BY category_name");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/vendor/:id/dashboard", async (req, res) => {
  const vendorId = req.params.id;

  try {
    const [vendorRows] = await db.query(
      `SELECT vendor_id, store_name, approval_status
       FROM Vendor
       WHERE vendor_id = ?`,
      [vendorId]
    );

    if (vendorRows.length === 0) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    if (!vendorRows[0].approval_status) {
      return res.json({ approved: false });
    }

    const [summaryRows] = await db.query(
      `SELECT
         COALESCE(SUM(oi.quantity * oi.price), 0) AS revenue,
         COUNT(oi.order_item_id) AS orders,
         COALESCE(SUM(cr.commission_amount), 0) AS commission
       FROM OrderItem oi
       JOIN Product p ON p.product_id = oi.product_id
       LEFT JOIN CommissionRecord cr
         ON cr.order_id = oi.order_id AND cr.vendor_id = p.vendor_id
       WHERE p.vendor_id = ?`,
      [vendorId]
    );

    const [chartRows] = await db.query(
      `SELECT
         DATE(o.order_date) AS date,
         SUM(oi.quantity * oi.price) AS daily_total
       FROM Orders o
       JOIN OrderItem oi ON oi.order_id = o.order_id
       JOIN Product p ON p.product_id = oi.product_id
       WHERE p.vendor_id = ?
       GROUP BY DATE(o.order_date)
       ORDER BY DATE(o.order_date) ASC`,
      [vendorId]
    );

    const summary = summaryRows[0];

    res.json({
      approved: true,
      revenue: Number(summary.revenue || 0),
      orders: Number(summary.orders || 0),
      commission: Number(summary.commission || 0),
      netPayout: Number(summary.revenue || 0) - Number(summary.commission || 0),
      chartData: chartRows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
