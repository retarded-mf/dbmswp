# DIY Multi-Vendor Marketplace

A comprehensive 3-tier web application designed for a college DBMS project. This platform allows vendors to sell electronics components, microcontrollers, and DIY kits to customers, while providing an administrative interface for platform management.

## 📖 Project Background
The **DIY Multi-Vendor Marketplace** was built to demonstrate core Database Management System (DBMS) concepts such as relational data modeling, ACID transactions, and complex SQL joins. The application bridges the gap between electronics hobbyists and specialized vendors, offering a curated experience for picking up parts for IoT, Robotics, and Embedded projects.

### Key Features:
- **Role-Based Access**: Specialized interfaces for Customers, Vendors, and Admins.
- **Product Management**: Vendors can manage stock, pricing, and visibility of their inventory.
- **Order Lifecycle**: Real-time tracking of orders from placement to delivery.
- **Commission System**: Automated platform fee calculation (12% commission) on every sale.
- **Analytics**: Data visualization for vendors to track sales performance over time.

## 💻 Tech Stack
- **Frontend**: 
  - HTML5 & CSS3 (Vanilla)
  - JavaScript (ES6+ Vanilla)
  - [Chart.js](https://www.chartjs.org/) for analytics
- **Backend**: 
  - [Node.js](https://nodejs.org/) with [Express](https://expressjs.com/)
  - [MySQL2](https://github.com/sidorares/node-mysql2) (Promise-based client)
- **Environment**: 
  - `dotenv` for secure configuration management

## 🗄️ Database Architecture
The heart of the project is a relational MySQL database designed with normalized tables to ensure data integrity.

### Schema Overview:
- **User**: Core identities (Customer, Vendor, Admin).
- **Vendor**: Extension of User with store-specific details and approval status.
- **Product**: Electronic components with links to categories, vendors, and project types.
- **Category / ProjectType / DifficultyLevel**: Lookup tables for organized product filtering.
- **Orders / OrderItem**: Management of transactions and individual line items.
- **CommissionRecord**: Financial ledger tracking the platform's 12% cut from each sale.
- **Kit / KitItem**: Support for bundled "DIY Kits" containing multiple products.

### Schema Script
The full database initialization script can be found in `sql/diy_marketplace.sql`. To set up the database locally:
```bash
# In your MySQL terminal
SOURCE sql/diy_marketplace.sql;
```