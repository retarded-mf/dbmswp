const db = require("../db");

/*
  Example queries:
  - List vendors:
    SELECT * FROM Vendor;

  - Approve vendor:
    UPDATE Vendor SET status='Approved' WHERE id=1;
*/

async function listVendors(req, res) {
  try {
    const [rows] = await db.query(
      "SELECT id, user_id, company_name, status, commission_rate, created_at FROM Vendor ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function approveVendor(req, res) {
  const { id } = req.params;
  const { status } = req.body; // 'Approved' or 'Rejected' or 'Pending'

  if (!status) {
    return res.status(400).json({ error: "status is required (Approved/Rejected/Pending)" });
  }

  try {
    const [result] = await db.query("UPDATE Vendor SET status = ? WHERE id = ?", [status, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  listVendors,
  approveVendor
};

