const db = require("../db");

async function getAllProducts(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT
         p.product_id,
         p.name,
         p.price,
         p.stock,
         p.status,
         p.status AS active,
         p.vendor_id,
         p.category_id,
         p.project_type_id,
         p.difficulty_id,
         v.store_name AS vendor_name,
         c.category_name AS category_name,
         pt.type_name,
         d.level
       FROM Product p
       JOIN Vendor v ON p.vendor_id = v.vendor_id
       JOIN Category c ON p.category_id = c.category_id
       LEFT JOIN ProjectType pt ON p.project_type_id = pt.project_type_id
       LEFT JOIN DifficultyLevel d ON p.difficulty_id = d.difficulty_id
       ORDER BY p.product_id DESC`
    );

    const products = rows.map((row) => ({
      id: row.product_id,
      ...row
    }));

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function addProduct(req, res) {
  const {
    name,
    price,
    stock,
    vendor_id,
    category_id,
    project_type_id,
    difficulty_id,
    status
  } = req.body;

  if (!name || price === undefined || stock === undefined || !vendor_id || !category_id) {
    return res.status(400).json({
      error: "name, price, stock, vendor_id and category_id are required"
    });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO Product
       (name, price, stock, status, vendor_id, category_id, project_type_id, difficulty_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        price,
        stock,
        status === undefined ? true : status,
        vendor_id,
        category_id,
        project_type_id || null,
        difficulty_id || null
      ]
    );

    res.status(201).json({
      success: true,
      product_id: result.insertId,
      id: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updateProduct(req, res) {
  const productId = req.params.id;
  const {
    name,
    price,
    stock,
    status,
    active,
    category_id,
    project_type_id,
    difficulty_id
  } = req.body;

  const fields = [];
  const values = [];

  if (name !== undefined) {
    fields.push("name = ?");
    values.push(name);
  }
  if (price !== undefined) {
    fields.push("price = ?");
    values.push(price);
  }
  if (stock !== undefined) {
    fields.push("stock = ?");
    values.push(stock);
  }
  if (status !== undefined) {
    fields.push("status = ?");
    values.push(status);
  } else if (active !== undefined) {
    fields.push("status = ?");
    values.push(active);
  }
  if (category_id !== undefined) {
    fields.push("category_id = ?");
    values.push(category_id);
  }
  if (project_type_id !== undefined) {
    fields.push("project_type_id = ?");
    values.push(project_type_id);
  }
  if (difficulty_id !== undefined) {
    fields.push("difficulty_id = ?");
    values.push(difficulty_id);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: "No fields provided for update" });
  }

  values.push(productId);

  try {
    const [result] = await db.query(
      `UPDATE Product SET ${fields.join(", ")} WHERE product_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function deleteProduct(req, res) {
  const productId = req.params.id;

  try {
    const [result] = await db.query("DELETE FROM Product WHERE product_id = ?", [productId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getAllProducts,
  addProduct,
  updateProduct,
  deleteProduct
};
