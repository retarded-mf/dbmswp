const db = require("../db");

async function listVendors(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT
         vendor_id,
         user_id,
         store_name,
         store_name AS company_name,
         vendor_type,
         approval_status,
         approval_status AS status
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
}

async function approveVendor(req, res) {
  const vendorId = req.params.id;
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
      [finalStatus, vendorId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  listVendors,
  approveVendor
};
