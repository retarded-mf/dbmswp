const mysql = require('mysql2/promise');

// Change standard root connectivity settings here if needed
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root', // Replace with your MySQL username
  password: 'root', // REPLACE with your MySQL root password!
  database: 'marketplace',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
