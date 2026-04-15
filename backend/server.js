const express = require("express");
const cors = require("cors");
const path = require("path");

const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const vendorRoutes = require("./routes/vendors");
const adminRoutes = require("./routes/admin");

const app = express();

app.use(cors());
app.use(express.json());

// Serve frontend from the main project's /public folder
const publicPath = path.join(__dirname, "..", "public");
app.use(express.static(publicPath));

// Fix common issue: default route serving index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// API routes
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);
app.use("/vendors", vendorRoutes);
app.use("/admin", adminRoutes);

// Simple 404 for API routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on http://localhost:" + PORT);
});

