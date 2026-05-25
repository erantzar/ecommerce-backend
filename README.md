# E-Commerce Backend API

> Production REST API powering the storefront and CRM dashboard.
> **Live:** `https://ecommerce-backend-production-28b4.up.railway.app/api/v1/` · **Repo:** private

---

## Demo Credentials (seeded)

| Role | Email | Password |
|---|---|---|
| Admin | eran.tzar@gmail.com | Test1234 |
| Admin | ben.spacode.co.il | Test1234 |
| Customer | alice@store.com | Customer1234 |

---

## Overview

Node.js / Express 5 server built in strict TypeScript. Handles JWT authentication, email verification, role-based access control, product catalogue management, cart operations, order lifecycle, and transactional email delivery via Resend.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 + TypeScript (ESM) |
| Framework | Express 5 |
| Database | MongoDB via Mongoose 9 |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Validation | Joi |
| File uploads | Multer + Cloudinary SDK |
| Email | Resend (HTTPS API — no SMTP) |
| Security | Helmet, express-rate-limit, CORS |
| Package manager | pnpm |

---

## Environment Variables

Create `server/.env` — **never commit this file.**

```env
PORT=3001

# MongoDB
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/ecommerce

# Auth
JWT_SECRET=your_jwt_secret_min_32_chars

# Cloudinary
CLOUDINARY_CLOUDE_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Resend (transactional email)
RESEND_API_KEY=re_xxxxxxxxxxxx

# CORS — comma-separated allowed origins
CORS_CLIENTS={"https://eranstore.com":"storefront",
              "https://www.eranstore.com":"storefront",
              "https://ecommerce-crm-xi.vercel.app":"crm",
              "http://localhost:3002":"crm"}

STOREFRONT_URL=https://eranstore.com





```

---

## Local Development

```bash
# 1. Clone and enter the server directory
git clone <https://github.com/erantzar/ecommerce-backend.git>
cd server

# 2. Install dependencies
pnpm install

# 3. Copy and fill environment variables
cp .env.example .env

# 4. Start development server (hot-reload via tsx + nodemon)
pnpm dev
# → API running at http://localhost:3001
```

---

## Other Scripts

```bash
pnpm build        # Compile TypeScript → dist/
pnpm start        # Run compiled output (production)
pnpm type-check   # Static type analysis without emit
pnpm run seed     # Wipe DB and seed 20 products + demo users with Cloudinary images
```

---

## API Structure

```
/api/v1
├── /auth          → register, login, logout, verify-email, password reset
├── /users         → profile, change-password, admin CRUD
├── /products      → catalogue, search/filter, ratings
├── /cart          → add, update, remove, sync (guest → auth)
└── /orders        → create, list, cancel, admin stats
```

---


