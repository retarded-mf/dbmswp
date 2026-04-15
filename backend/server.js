const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");

const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const vendorRoutes = require("./routes/vendors");
const adminRoutes = require("./routes/admin");

const app = express();
const publicPath = path.join(__dirname, "..", "public");

app.use(cors());
app.use(express.json());
app.use(express.static(publicPath));

app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

app.use("/products", productRoutes);
app.use("/orders", orderRoutes);
app.use("/vendors", vendorRoutes);
app.use("/admin", adminRoutes);

// Extra route for the demo frontend.
app.get("/categories", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM Category ORDER BY category_name");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Extra route for a simple vendor dashboard view.
app.get("/vendor/:id/dashboard", async (req, res) => {
  const vendorId = req.params.id;

  try {
    const [vendorRows] = await db.query(
      `SELECT vendor_id, store_name, approval_status
       FROM Vendor
       WHERE vendor_id = ?`,
      [vendorId]
    );

    if (vendorRows.length === 0) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    if (!vendorRows[0].approval_status) {
      return res.json({ approved: false });
    }

    const [summaryRows] = await db.query(
      `SELECT
         COALESCE(SUM(oi.quantity * oi.price), 0) AS revenue,
         COUNT(oi.order_item_id) AS orders,
         COALESCE(SUM(cr.commission_amount), 0) AS commission
       FROM OrderItem oi
       JOIN Product p ON p.product_id = oi.product_id
       LEFT JOIN CommissionRecord cr
         ON cr.order_id = oi.order_id AND cr.vendor_id = p.vendor_id
       WHERE p.vendor_id = ?`,
      [vendorId]
    );

    const [chartRows] = await db.query(
      `SELECT
         DATE(o.order_date) AS date,
         SUM(oi.quantity * oi.price) AS daily_total
       FROM Orders o
       JOIN OrderItem oi ON oi.order_id = o.order_id
       JOIN Product p ON p.product_id = oi.product_id
       WHERE p.vendor_id = ?
       GROUP BY DATE(o.order_date)
       ORDER BY DATE(o.order_date) ASC`,
      [vendorId]
    );

    const summary = summaryRows[0];

    res.json({
      approved: true,
      revenue: Number(summary.revenue || 0),
      orders: Number(summary.orders || 0),
      commission: Number(summary.commission || 0),
      netPayout: Number(summary.revenue || 0) - Number(summary.commission || 0),
      chartData: chartRows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
