const db = require("../db");

async function listVendors(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT
         vendor_id,
         vendor_id AS id,
         user_id,
         store_name,
         store_name AS company_name,
         vendor_type,
         approval_status,
         COALESCE(commission_rate, 0) AS commission_rate,
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

async function applyVendor(req, res) {
  const { user_id, store_name, vendor_type } = req.body;
  if (!user_id || !store_name || !vendor_type) {
    return res.status(400).json({ error: "user_id, store_name, vendor_type are required" });
  }
  try {
    const [result] = await db.query(
      `INSERT INTO Vendor (user_id, store_name, vendor_type, approval_status, commission_rate)
       VALUES (?, ?, ?, FALSE, 0)`,
      [user_id, store_name, vendor_type]
    );
    res.status(201).json({ success: true, vendor_id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function removeVendor(req, res) {
  const vendorId = req.params.id;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Delete CommissionRecord
    await connection.query("DELETE FROM CommissionRecord WHERE vendor_id = ?", [vendorId]);
    
    // Delete Payout
    await connection.query("DELETE FROM Payout WHERE vendor_id = ?", [vendorId]);
    
    // Delete KitItem related to Kits of this vendor
    await connection.query("DELETE FROM KitItem WHERE kit_id IN (SELECT kit_id FROM Kit WHERE vendor_id = ?)", [vendorId]);
    
    // Delete Kits
    await connection.query("DELETE FROM Kit WHERE vendor_id = ?", [vendorId]);
    
    // Delete OrderItem related to Products of this vendor
    await connection.query("DELETE FROM OrderItem WHERE product_id IN (SELECT product_id FROM Product WHERE vendor_id = ?)", [vendorId]);
    
    // Delete Products
    await connection.query("DELETE FROM Product WHERE vendor_id = ?", [vendorId]);
    
    // Delete Vendor
    const [result] = await connection.query("DELETE FROM Vendor WHERE vendor_id = ?", [vendorId]);
    
    await connection.commit();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
}

module.exports = {
  listVendors,
  approveVendor,
  applyVendor,
  removeVendor
};
