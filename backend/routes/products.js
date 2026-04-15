const express = require("express");
const router = express.Router();

const productController = require("../controllers/productController");

// PRODUCT ROUTES
// GET /products → get all products
router.get("/", productController.getAllProducts);

// POST /products → add product
router.post("/", productController.addProduct);

// PUT /products/:id → update product
router.put("/:id", productController.updateProduct);

// DELETE /products/:id → delete product
router.delete("/:id", productController.deleteProduct);

module.exports = router;

