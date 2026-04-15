CREATE DATABASE IF NOT EXISTS marketplace;
USE marketplace;

CREATE TABLE User (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role ENUM('Customer', 'Vendor', 'Admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Vendor (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    company_name VARCHAR(255) NOT NULL,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    commission_rate DECIMAL(5,2) DEFAULT 12.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE
);

CREATE TABLE Category (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE Product (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT,
    category_id INT,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    emoji VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES Vendor(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Category(id) ON DELETE SET NULL
);

CREATE TABLE Cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    product_id INT,
    quantity INT DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Product(id) ON DELETE CASCADE
);

CREATE TABLE `Order` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('Placed', 'Confirmed', 'Shipped', 'Delivered') DEFAULT 'Placed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE
);

CREATE TABLE OrderItem (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    product_id INT,
    quantity INT NOT NULL,
    price_at_time DECIMAL(10,2) NOT NULL,
    vendor_id INT,
    status ENUM('Placed', 'Confirmed', 'Shipped', 'Delivered') DEFAULT 'Placed',
    FOREIGN KEY (order_id) REFERENCES `Order`(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Product(id) ON DELETE SET NULL,
    FOREIGN KEY (vendor_id) REFERENCES Vendor(id) ON DELETE SET NULL
);

CREATE TABLE CommissionRecord (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_item_id INT,
    vendor_id INT,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_item_id) REFERENCES OrderItem(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES Vendor(id) ON DELETE CASCADE
);

CREATE TABLE Payout (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('Pending', 'Paid') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES Vendor(id) ON DELETE CASCADE
);

-- Mock Data
INSERT INTO User (name, email, role) VALUES 
('Admin', 'admin@market.com', 'Admin'),
('Customer One', 'cust@mail.com', 'Customer'),
('TechZone Owner', 'tech@mail.com', 'Vendor'),
('BookHub Owner', 'book@mail.com', 'Vendor'),
('StyleStreet Owner', 'style@mail.com', 'Vendor');

INSERT INTO Vendor (user_id, company_name, status) VALUES 
(3, 'TechZone', 'Approved'),
(4, 'BookHub', 'Approved'),
(5, 'StyleStreet', 'Pending');

INSERT INTO Category (name) VALUES 
('Electronics'), ('Books'), ('Fashion'), ('Home');

INSERT INTO Product (vendor_id, category_id, name, price, stock, active, emoji) VALUES 
(1, 1, 'Wireless Mouse', 25.00, 10, TRUE, '🖱️'),
(1, 1, 'Mechanical Keyboard', 80.00, 4, TRUE, '⌨️'),
(1, 1, 'Noise Cancelling Headphones', 150.00, 15, TRUE, '🎧'),
(2, 2, 'The Great Gatsby', 10.00, 30, TRUE, '📖'),
(2, 2, 'Data Structures in C++', 45.00, 5, TRUE, '📚'),
(3, 3, 'Cotton T-Shirt', 15.00, 50, TRUE, '👕'),
(3, 3, 'Denim Jacket', 60.00, 12, TRUE, '🧥'),
(1, 4, 'Smart Desk Lamp', 35.00, 8, TRUE, '💡');
