const db = require("../db");

/*
  Example request body for placing order:
  POST /orders
  {
    "user_id": 1,
    "cart_items": [
      { "product_id": 2, "vendor_id": 1, "quantity": 2, "price": 99.50 },
      { "product_id": 3, "vendor_id": 2, "quantity": 1, "price": 250 }
    ]
  }
*/

async function placeOrder(req, res) {
  const { user_id, cart_items } = req.body;

  if (!user_id || !Array.isArray(cart_items) || cart_items.length === 0) {
    return res.status(400).json({ error: "user_id and cart_items are required" });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    let totalAmount = 0;
    for (const item of cart_items) {
      totalAmount += Number(item.price) * Number(item.quantity);
    }

    // 1) Insert into Order table
    const [orderResult] = await connection.query(
      "INSERT INTO `Order` (user_id, total_amount) VALUES (?, ?)",
      [user_id, totalAmount]
    );
    const orderId = orderResult.insertId;

    // 2) Insert rows in OrderItem + 3) reduce stock + 4) commission + 5) commission record
    for (const item of cart_items) {
      const productId = item.product_id;
      const vendorId = item.vendor_id;
      const quantity = Number(item.quantity);
      const price = Number(item.price);

      if (!productId || !vendorId || !quantity || price === undefined) {
        throw new Error("Each cart item needs product_id, vendor_id, quantity, price");
      }

      // Lock product row to avoid race conditions
      const [productRows] = await connection.query(
        "SELECT stock FROM Product WHERE id = ? FOR UPDATE",
        [productId]
      );
      if (productRows.length === 0) {
        throw new Error("Product not found: " + productId);
      }
      if (Number(productRows[0].stock) < quantity) {
        throw new Error("Not enough stock for product: " + productId);
      }

      // Insert order item
      const [itemResult] = await connection.query(
        `
        INSERT INTO OrderItem (order_id, product_id, vendor_id, quantity, price_at_time)
        VALUES (?, ?, ?, ?, ?)
        `,
        [orderId, productId, vendorId, quantity, price]
      );
      const orderItemId = itemResult.insertId;

      // Reduce stock
      await connection.query(
        "UPDATE Product SET stock = stock - ? WHERE id = ?",
        [quantity, productId]
      );

      // Commission rate (vendor specific if exists, else default 12%)
      const [vendorRows] = await connection.query(
        "SELECT commission_rate FROM Vendor WHERE id = ?",
        [vendorId]
      );
      const rate = vendorRows[0]?.commission_rate !== undefined ? Number(vendorRows[0].commission_rate) : 12;

      const commissionAmount = (price * quantity * rate) / 100;

      await connection.query(
        "INSERT INTO CommissionRecord (order_item_id, vendor_id, amount) VALUES (?, ?, ?)",
        [orderItemId, vendorId, commissionAmount]
      );
    }

    await connection.commit();
    res.json({ success: true, orderId });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
}

async function getAllOrders(req, res) {
  try {
    const [rows] = await db.query(
      `
      SELECT 
        o.id AS order_id,
        o.user_id,
        o.status AS order_status,
        o.total_amount,
        o.created_at,
        oi.id AS order_item_id,
        oi.product_id,
        p.name AS product_name,
        oi.vendor_id,
        v.company_name AS vendor_name,
        oi.quantity,
        oi.price_at_time,
        oi.status AS item_status
      FROM \`Order\` o
      JOIN OrderItem oi ON oi.order_id = o.id
      JOIN Product p ON p.id = oi.product_id
      JOIN Vendor v ON v.id = oi.vendor_id
      ORDER BY o.created_at DESC, oi.id DESC
      `
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateOrderStatus(req, res) {
  const { id } = req.params;
  const { type, status } = req.body;

  if (!status) {
    return res.status(400).json({ error: "status is required" });
  }

  try {
    if (type === "item") {
      const [result] = await db.query("UPDATE OrderItem SET status = ? WHERE id = ?", [status, id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Order item not found" });
      }
      return res.json({ success: true });
    }

    const [result] = await db.query("UPDATE `Order` SET status = ? WHERE id = ?", [status, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  placeOrder,
  getAllOrders,
  updateOrderStatus
};

