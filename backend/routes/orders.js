const express = require("express");
const router = express.Router();

const orderController = require("../controllers/orderController");

// ORDER ROUTES
// POST /orders → place order
router.post("/", orderController.placeOrder);

// GET /orders → get all orders
router.get("/", orderController.getAllOrders);

// PUT /orders/:id/status → update order status
router.put("/:id/status", orderController.updateOrderStatus);

module.exports = router;

