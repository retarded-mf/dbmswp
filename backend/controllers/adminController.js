const db = require("../db");

async function getAllTransactions(req, res) {
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
}

async function updateCommissionRate(req, res) {
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
}

module.exports = {
  getAllTransactions,
  updateCommissionRate
};
