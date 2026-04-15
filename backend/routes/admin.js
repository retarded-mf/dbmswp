const express = require("express");
const adminController = require("../controllers/adminController");

const router = express.Router();

router.get("/transactions", adminController.getAllTransactions);
router.put("/commission", adminController.updateCommissionRate);
router.put("/settings/commission", adminController.updateCommissionRate);

module.exports = router;
