const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");

// ADMIN ROUTES
// GET /admin/transactions → get all transactions
router.get("/transactions", adminController.getAllTransactions);

// PUT /admin/commission → update commission rate
router.put("/commission", adminController.updateCommissionRate);

module.exports = router;

