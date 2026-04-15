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
      "UPDATE Vendor SET commission_rate = ? WHERE vendor_id > 0",
      [rate]
    );

    res.json({
      success: true,
      updated_rows: result.affectedRows,
      message:
        "Default commission % stored on vendors; new orders still use the rate applied at checkout in the demo."
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getAllTransactions,
  updateCommissionRate
};
