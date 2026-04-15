DROP DATABASE IF EXISTS diy_marketplace;
CREATE DATABASE diy_marketplace;
USE diy_marketplace;

CREATE TABLE User (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  role ENUM('customer','vendor','admin')
);

CREATE TABLE Vendor (
  vendor_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  store_name VARCHAR(100),
  vendor_type VARCHAR(50),
  approval_status BOOLEAN DEFAULT FALSE,
  commission_rate DECIMAL(5,2) DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES User(user_id)
);

CREATE TABLE Category (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100)
);

CREATE TABLE ProjectType (
  project_type_id INT AUTO_INCREMENT PRIMARY KEY,
  type_name VARCHAR(100)
);

CREATE TABLE DifficultyLevel (
  difficulty_id INT AUTO_INCREMENT PRIMARY KEY,
  level VARCHAR(50)
);

CREATE TABLE Product (
  product_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150),
  price DECIMAL(10,2),
  stock INT,
  status BOOLEAN DEFAULT TRUE,
  vendor_id INT,
  category_id INT,
  project_type_id INT,
  difficulty_id INT,
  FOREIGN KEY (vendor_id) REFERENCES Vendor(vendor_id),
  FOREIGN KEY (category_id) REFERENCES Category(category_id),
  FOREIGN KEY (project_type_id) REFERENCES ProjectType(project_type_id),
  FOREIGN KEY (difficulty_id) REFERENCES DifficultyLevel(difficulty_id)
);

CREATE TABLE Kit (
  kit_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150),
  price DECIMAL(10,2),
  vendor_id INT,
  FOREIGN KEY (vendor_id) REFERENCES Vendor(vendor_id)
);

CREATE TABLE KitItem (
  kit_item_id INT AUTO_INCREMENT PRIMARY KEY,
  kit_id INT,
  product_id INT,
  quantity INT,
  FOREIGN KEY (kit_id) REFERENCES Kit(kit_id),
  FOREIGN KEY (product_id) REFERENCES Product(product_id)
);

CREATE TABLE Orders (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50),
  total_amount DECIMAL(10,2),
  FOREIGN KEY (user_id) REFERENCES User(user_id)
);

CREATE TABLE OrderItem (
  order_item_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT,
  product_id INT,
  quantity INT,
  price DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'Placed',
  FOREIGN KEY (order_id) REFERENCES Orders(order_id),
  FOREIGN KEY (product_id) REFERENCES Product(product_id)
);

CREATE TABLE CommissionRecord (
  commission_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT,
  vendor_id INT,
  commission_amount DECIMAL(10,2),
  commission_rate DECIMAL(5,2),
  FOREIGN KEY (order_id) REFERENCES Orders(order_id),
  FOREIGN KEY (vendor_id) REFERENCES Vendor(vendor_id)
);

CREATE TABLE Payout (
  payout_id INT AUTO_INCREMENT PRIMARY KEY,
  vendor_id INT,
  amount DECIMAL(10,2),
  payout_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES Vendor(vendor_id)
);

INSERT INTO User (name, email, role) VALUES
('Aarav Shah', 'aarav.customer@gmail.com', 'customer'),
('Riya Mehta', 'riya.vendor@gmail.com', 'vendor'),
('Kunal Verma', 'kunal.admin@gmail.com', 'admin'),
('Neha Iyer', 'neha.customer@gmail.com', 'customer'),
('Tech Store Owner', 'owner.vendor@gmail.com', 'vendor');

INSERT INTO Vendor (user_id, store_name, vendor_type, approval_status, commission_rate) VALUES
(2, 'Maker Hub', 'Electronics Store', TRUE, 0),
(5, 'DIY Tech World', 'Component Supplier', FALSE, 0);

INSERT INTO Category (category_name) VALUES
('Microcontrollers'),
('Sensors'),
('Electronics Components'),
('Robotics Parts'),
('Tools'),
('Development Boards'),
('Power Supplies'),
('3D Printing');

INSERT INTO ProjectType (type_name) VALUES
('IoT'),
('Robotics'),
('Embedded Systems'),
('Mini Project'),
('Final Year Project');

INSERT INTO DifficultyLevel (level) VALUES
('Beginner'),
('Intermediate'),
('Advanced');

INSERT INTO Product
(name, price, stock, vendor_id, category_id, project_type_id, difficulty_id)
VALUES
('Arduino UNO R3',1329.00,50,1,1,1,1),
('ESP32 WiFi Module',829.00,40,1,1,1,2),
('Raspberry Pi Pico',579.00,30,1,6,3,2),
('Ultrasonic Distance Sensor HC-SR04',249.00,80,1,2,2,1),
('DHT11 Temperature Sensor',289.00,70,1,2,1,1),
('Infrared Obstacle Sensor',209.00,60,1,2,2,1),
('Servo Motor SG90',414.00,65,1,4,2,1),
('Stepper Motor Driver Kit',1079.00,25,1,4,2,2),
('Breadboard 830 Points',329.00,90,1,3,4,1),
('Jumper Wires Pack',207.00,100,1,3,4,1),
('LED Assortment Kit',374.00,75,1,3,4,1),
('Resistor Kit 600pcs',499.00,50,1,3,4,1),
('L298N Motor Driver',539.00,40,1,4,2,2),
('Relay Module 5V',269.00,45,1,3,1,2),
('Soldering Iron Kit',1579.00,20,1,5,4,1),
('LM7805 5V Voltage Regulator',45.00,120,1,7,1,1),
('9V Battery Clip + Snap Connector',89.00,80,1,7,4,1),
('PLA Filament 1kg (White)',899.00,25,1,8,5,2);

INSERT INTO Kit (name, price, vendor_id) VALUES
('Beginner IoT Kit', 2499.00, 1),
('Robotics Starter Kit', 3299.00, 1);

INSERT INTO KitItem (kit_id, product_id, quantity) VALUES
(1, 1, 1),
(1, 5, 1),
(1, 10, 1),
(2, 7, 2),
(2, 8, 1),
(2, 13, 1);

-- Orders, commissions, and payouts start empty; they are populated when customers place orders.
