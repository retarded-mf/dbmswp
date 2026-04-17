const express = require("express");
const router = express.Router();

const vendorController = require("../controllers/vendorController");

// VENDOR ROUTES
// GET /vendors → list vendors
router.get("/", vendorController.listVendors);

// PUT /vendors/:id/approve → approve vendor
router.put("/:id/approve", vendorController.approveVendor);

// POST /vendors → apply for a vendor account
router.post("/", vendorController.applyVendor);

// DELETE /vendors/:id → remove vendor
router.delete("/:id", vendorController.removeVendor);

module.exports = router;

