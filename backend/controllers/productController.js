const db = require("../db");

/*
  Example queries:
  - Get all products with vendor + category:
    SELECT p.*, v.company_name AS vendor_name, c.name AS category_name
    FROM Product p
    JOIN Vendor v ON p.vendor_id = v.id
    JOIN Category c ON p.category_id = c.id;
*/

async function getAllProducts(req, res) {
  try {
    const [rows] = await db.query(
      `
      SELECT 
        p.*,
        v.company_name AS vendor_name,
        c.name AS category_name
      FROM Product p
      JOIN Vendor v ON p.vendor_id = v.id
      JOIN Category c ON p.category_id = c.id
      ORDER BY p.created_at DESC
      `
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function addProduct(req, res) {
  const {
    vendor_id,
    category_id,
    project_type_id,
    difficulty_level_id,
    name,
    price,
    stock,
    emoji
  } = req.body;

  if (!vendor_id || !category_id || !name || price === undefined || stock === undefined) {
    return res.status(400).json({
      error: "vendor_id, category_id, name, price, stock are required"
    });
  }

  try {
    const [result] = await db.query(
      `
      INSERT INTO Product
        (vendor_id, category_id, project_type_id, difficulty_level_id, name, price, stock, emoji)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        vendor_id,
        category_id,
        project_type_id || null,
        difficulty_level_id || null,
        name,
        price,
        stock,
        emoji || null
      ]
    );

    res.json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateProduct(req, res) {
  const { id } = req.params;
  const { active, stock, price, name } = req.body;

  try {
    const fields = [];
    const values = [];

    if (active !== undefined) {
      fields.push("active = ?");
      values.push(active);
    }
    if (stock !== undefined) {
      fields.push("stock = ?");
      values.push(stock);
    }
    if (price !== undefined) {
      fields.push("price = ?");
      values.push(price);
    }
    if (name !== undefined) {
      fields.push("name = ?");
      values.push(name);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    values.push(id);

    const [result] = await db.query(
      `UPDATE Product SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteProduct(req, res) {
  const { id } = req.params;

  try {
    const [result] = await db.query("DELETE FROM Product WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getAllProducts,
  addProduct,
  updateProduct,
  deleteProduct
};

