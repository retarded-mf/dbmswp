# Student DIY Components Marketplace System (Backend)

This is a simple college-friendly backend using:
- Node.js
- Express.js
- MySQL
- `mysql2` (with connection pooling)

It also serves the frontend from the main project's `public/` folder.

## Setup (MySQL)

1. Create a database called `student_marketplace`
2. Create the tables (starter schema is inside `backend/db.js` as a comment)

Update DB settings using environment variables (optional):
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

## Run instructions

From the project root:

```bash
cd backend
npm install
node server.js
```

Open:
- http://localhost:3000

## API routes

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

