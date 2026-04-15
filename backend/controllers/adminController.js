const db = require("../db");

/*
  Example queries:
  - Transactions (commission records):
    SELECT cr.*, oi.order_id, v.company_name
    FROM CommissionRecord cr
    JOIN OrderItem oi ON cr.order_item_id = oi.id
    JOIN Vendor v ON cr.vendor_id = v.id;

  - Update commission rate for all vendors (simple demo):
    UPDATE Vendor SET commission_rate = 15;
*/

async function getAllTransactions(req, res) {
  try {
    const [rows] = await db.query(
      `
      SELECT 
        cr.id,
        cr.created_at,
        cr.amount AS commission,
        oi.id AS order_item_id,
        oi.order_id,
        oi.product_id,
        oi.vendor_id,
        (oi.price_at_time * oi.quantity) AS item_total,
        v.company_name AS vendor_name,
        o.status AS order_status
      FROM CommissionRecord cr
      JOIN OrderItem oi ON cr.order_item_id = oi.id
      JOIN Vendor v ON cr.vendor_id = v.id
      JOIN \`Order\` o ON oi.order_id = o.id
      ORDER BY cr.created_at DESC
      `
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateCommissionRate(req, res) {
  const { rate } = req.body;

  if (rate === undefined) {
    return res.status(400).json({ error: "rate is required" });
  }

  try {
    const [result] = await db.query("UPDATE Vendor SET commission_rate = ?", [rate]);
    res.json({ success: true, updatedRows: result.affectedRows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getAllTransactions,
  updateCommissionRate
};

