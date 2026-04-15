const express = require("express");
const router = express.Router();

const vendorController = require("../controllers/vendorController");

// VENDOR ROUTES
// GET /vendors → list vendors
router.get("/", vendorController.listVendors);

// PUT /vendors/:id/approve → approve vendor
router.put("/:id/approve", vendorController.approveVendor);

module.exports = router;

