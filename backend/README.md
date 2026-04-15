# Student DIY Components Marketplace System

Simple backend for a DBMS + Web Programming college project using:

- Node.js
- Express.js
- MySQL
- mysql2

It serves the frontend from the root [public](C:/Users/Aditya%20Rane/Downloads/Coding%20Projects/DBMS%20proj/public) folder and exposes CRUD APIs for products, vendors, orders, and admin transactions.

## Folder structure

```text
backend/
  server.js
  db.js
  package.json
  routes/
  controllers/
public/
  index.html
sql/
  diy_marketplace.sql
```

## Database setup

1. Open MySQL Workbench or phpMyAdmin.
2. Run [sql/diy_marketplace.sql](C:/Users/Aditya%20Rane/Downloads/Coding%20Projects/DBMS%20proj/sql/diy_marketplace.sql)
3. This creates:
   - database `diy_marketplace`
   - all required tables
   - sample users, vendors, categories, products, kits, orders, commissions, and payouts

## Backend configuration

The backend reads database config from environment variables if provided:

- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

Default values:

- host: `localhost`
- user: `root`
- password: empty string
- database: `diy_marketplace`

## Install and run

From the backend folder:

```bash
npm install
node server.js
```

Server URL:

- `http://localhost:3000`

## Main API routes

- `GET /products`
- `POST /products`
- `PUT /products/:id`
- `DELETE /products/:id`
- `GET /vendors`
- `PUT /vendors/:id/approve`
- `POST /orders`
- `GET /orders`
- `PUT /orders/:id/status`
- `GET /admin/transactions`
- `PUT /admin/commission`

## Extra demo routes

- `GET /categories`
- `GET /vendor/:id/dashboard`
- `PUT /admin/settings/commission`

## Quick test

Open these in browser or Postman after starting the server:

- `http://localhost:3000/products`
- `http://localhost:3000/vendors`
- `http://localhost:3000/orders`

