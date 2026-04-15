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

INSERT INTO Vendor (user_id, store_name, vendor_type, approval_status) VALUES
(2, 'Maker Hub', 'Electronics Store', TRUE),
(5, 'DIY Tech World', 'Component Supplier', FALSE);

INSERT INTO Category (category_name) VALUES
('Microcontrollers'),
('Sensors'),
('Electronics Components'),
('Robotics Parts'),
('Tools'),
('Development Boards');

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
('Arduino UNO R3',15.99,50,1,1,1,1),
('ESP32 WiFi Module',9.99,40,1,1,1,2),
('Raspberry Pi Pico',6.99,30,1,6,3,2),
('Ultrasonic Distance Sensor HC-SR04',2.99,80,1,2,2,1),
('DHT11 Temperature Sensor',3.49,70,1,2,1,1),
('Infrared Obstacle Sensor',2.50,60,1,2,2,1),
('Servo Motor SG90',4.99,65,1,4,2,1),
('Stepper Motor Driver Kit',12.99,25,1,4,2,2),
('Breadboard 830 Points',3.99,90,1,3,4,1),
('Jumper Wires Pack',2.49,100,1,3,4,1),
('LED Assortment Kit',4.50,75,1,3,4,1),
('Resistor Kit 600pcs',5.99,50,1,3,4,1),
('L298N Motor Driver',6.50,40,1,4,2,2),
('Relay Module 5V',3.25,45,1,3,1,2),
('Soldering Iron Kit',18.99,20,1,5,4,1);

INSERT INTO Kit (name, price, vendor_id) VALUES
('Beginner IoT Kit', 29.99, 1),
('Robotics Starter Kit', 39.99, 1);

INSERT INTO KitItem (kit_id, product_id, quantity) VALUES
(1, 1, 1),
(1, 5, 1),
(1, 10, 1),
(2, 7, 2),
(2, 8, 1),
(2, 13, 1);

INSERT INTO Orders (user_id, status, total_amount) VALUES
(1, 'Placed', 25.98),
(4, 'Delivered', 18.48);

INSERT INTO OrderItem (order_id, product_id, quantity, price, status) VALUES
(1, 2, 2, 9.99, 'Placed'),
(1, 4, 2, 2.99, 'Placed'),
(2, 1, 1, 15.99, 'Delivered'),
(2, 10, 1, 2.49, 'Delivered');

INSERT INTO CommissionRecord (order_id, vendor_id, commission_amount, commission_rate) VALUES
(1, 1, 3.12, 12.00),
(2, 1, 2.22, 12.00);

INSERT INTO Payout (vendor_id, amount) VALUES
(1, 22.86),
(1, 16.26);
