const db = require("../db");

async function placeOrder(req, res) {
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

      const commissionRate = 12;
      const commissionAmount = item.price * item.quantity * (commissionRate / 100);
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
}

async function getAllOrders(req, res) {
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
         oi.price AS price_at_time,
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
}

async function updateOrderStatus(req, res) {
  const id = req.params.id;
  const { status, type } = req.body;

  if (!status) {
    return res.status(400).json({ error: "status is required" });
  }

  try {
    if (type === "item") {
      const [result] = await db.query(
        "UPDATE OrderItem SET status = ? WHERE order_item_id = ?",
        [status, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Order item not found" });
      }

      return res.json({ success: true });
    }

    const [result] = await db.query(
      "UPDATE Orders SET status = ? WHERE order_id = ?",
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  placeOrder,
  getAllOrders,
  updateOrderStatus
};
