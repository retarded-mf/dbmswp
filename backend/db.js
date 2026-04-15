const mysql = require("mysql2/promise");

/*
  ============================
  Example MySQL schema (starter)
  ============================
  NOTE: Run this in MySQL Workbench / phpMyAdmin and adjust types as needed.

  CREATE DATABASE IF NOT EXISTS student_marketplace;
  USE student_marketplace;

  CREATE TABLE User (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE Vendor (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    company_name VARCHAR(120) NOT NULL,
    status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
    commission_rate DECIMAL(5,2) DEFAULT 12.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(id)
  );

  CREATE TABLE Category (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE
  );

  CREATE TABLE ProjectType (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE
  );

  CREATE TABLE DifficultyLevel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
  );

  CREATE TABLE Product (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    category_id INT NOT NULL,
    project_type_id INT NULL,
    difficulty_level_id INT NULL,
    name VARCHAR(120) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    emoji VARCHAR(10),
    active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES Vendor(id),
    FOREIGN KEY (category_id) REFERENCES Category(id),
    FOREIGN KEY (project_type_id) REFERENCES ProjectType(id),
    FOREIGN KEY (difficulty_level_id) REFERENCES DifficultyLevel(id)
  );

  CREATE TABLE Kit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    title VARCHAR(120) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES Product(id)
  );

  CREATE TABLE KitItem (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kit_id INT NOT NULL,
    item_name VARCHAR(120) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    FOREIGN KEY (kit_id) REFERENCES Kit(id)
  );

  CREATE TABLE `Order` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    status ENUM('Placed','Processing','Shipped','Delivered','Cancelled') DEFAULT 'Placed',
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(id)
  );

  CREATE TABLE OrderItem (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    vendor_id INT NOT NULL,
    quantity INT NOT NULL,
    price_at_time DECIMAL(10,2) NOT NULL,
    status ENUM('Placed','Processing','Shipped','Delivered','Cancelled') DEFAULT 'Placed',
    FOREIGN KEY (order_id) REFERENCES `Order`(id),
    FOREIGN KEY (product_id) REFERENCES Product(id),
    FOREIGN KEY (vendor_id) REFERENCES Vendor(id)
  );

  CREATE TABLE CommissionRecord (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_item_id INT NOT NULL,
    vendor_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_item_id) REFERENCES OrderItem(id),
    FOREIGN KEY (vendor_id) REFERENCES Vendor(id)
  );

  CREATE TABLE Payout (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('Pending','Paid') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES Vendor(id)
  );
*/

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "student_marketplace",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;

