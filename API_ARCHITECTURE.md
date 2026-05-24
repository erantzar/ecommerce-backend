# API Architecture — E-Commerce Backend

> **Stack:** Node.js · Express v5 · TypeScript · MongoDB (Mongoose) · JWT · Cloudinary  
> **Base URL:** `http://localhost:3001/api/v1`

---

## Table of Contents

1. [Server & Global Middleware](#1-server--global-middleware)
2. [Authentication Routes](#2-authentication-routes)
3. [User Routes](#3-user-routes)
4. [Product Routes](#4-product-routes)
5. [Cart Routes](#5-cart-routes)
6. [Order Routes](#6-order-routes)
7. [Middleware Reference](#7-middleware-reference)
8. [Error Handling](#8-error-handling)
9. [Request & Response Shapes](#9-request--response-shapes)
10. [Security Summary](#10-security-summary)
11. [Environment Variables](#11-environment-variables)

---

## 1. Server & Global Middleware

**Entry point:** `server/server.ts`

### Global middleware stack (applied in order)

| # | Middleware | Config |
|---|-----------|--------|
| 1 | `express.json()` | Parse JSON bodies |
| 2 | `cors(corsOptions)` | Dynamic per-client-type (see §7.4) |
| 3 | `helmet()` | Security headers; CSP allows `res.cloudinary.com` |
| 4 | `express-rate-limit` | **100 req / 60 s** globally |

Trust proxy is enabled for correct IP detection behind reverse proxies.

### Route mounts

| Prefix | Router |
|--------|--------|
| `/api/v1/AuthRoutes` | Authentication |
| `/api/v1/users` | User management |
| `/api/v1/products` | Products & ratings |
| `/api/v1/cart` | Shopping cart |
| `/api/v1/orders` | Orders |

---

## 2. Authentication Routes

**Router file:** `server/sec/features/auth/auth.router.ts`  
**Controller:** `server/sec/features/auth/auth.controller.ts`  
**Schemas:** `server/sec/features/auth/auth.schema.ts`

> Login endpoint has an extra rate limit: **10 req / 60 s**.

### Public endpoints

| Method | Path | Middleware | Description |
|--------|------|-----------|-------------|
| `POST` | `/AuthRoutes/register` | `validate(registerSchema)` | Create account; sends verification email |
| `POST` | `/AuthRoutes/login` | `limiterLogIn`, `validate(loginSchema)` | Login; returns 7-day JWT |
| `GET` | `/AuthRoutes/verify-email/:rawToken` | — | Confirm email address |
| `POST` | `/AuthRoutes/password-forgot` | `validate(forgotPasswordSchema)` | Send reset link (15 min expiry) |
| `POST` | `/AuthRoutes/password-reset/:token` | `validate(resetPasswordSchema)` | Set new password |
| `POST` | `/AuthRoutes/admin/login` | `validate(loginSchema)` | Admin login step 1 — sends 2FA code |
| `POST` | `/AuthRoutes/admin/verify-2fa` | `validate(verify2FASchema)` | Admin login step 2 — returns 1-hour JWT |

### Protected endpoints

| Method | Path | Middleware | Description |
|--------|------|-----------|-------------|
| `POST` | `/AuthRoutes/logout` | `authMiddleware` | Invalidate current token |
| `GET` | `/AuthRoutes/me` | `authMiddleware` | Get own profile |

### Validation rules

| Field | Rule |
|-------|------|
| `name` | String, min 2 chars |
| `email` | Valid email |
| `password` (register / reset) | 8–12 chars, ≥1 uppercase, ≥1 lowercase, ≥1 digit |
| `password` (login) | String, min 6 chars |
| `userId` (2FA) | 24-char hex string |
| `code` (2FA) | 6-digit string |

---

## 3. User Routes

**Router file:** `server/sec/features/users/user.router.ts`  
**Controller:** `server/sec/features/users/user.controller.ts`

### Authenticated user endpoints

| Method | Path | Middleware | Description |
|--------|------|-----------|-------------|
| `GET` | `/users/profile` | `authMiddleware` | Get own profile |
| `PUT` | `/users/profile` | `authMiddleware`, `uploadUserAvatar.single('image')` | Update name / email / avatar |
| `PUT` | `/users/change-password` | `authMiddleware`, `validate(changePasswordSchema)` | Change password |
| `POST` | `/users/addresses` | `authMiddleware` | Add a shipping address |
| `PUT` | `/users/addresses/:addrId` | `authMiddleware` | Update an address |
| `DELETE` | `/users/addresses/:addrId` | `authMiddleware` | Remove an address |

### Admin-only endpoints

| Method | Path | Middleware | Description |
|--------|------|-----------|-------------|
| `GET` | `/users/` | `authMiddleware`, `checkRole` | List all users |
| `PUT` | `/users/role/:id` | `authMiddleware`, `checkRole`, `validate(updateRoleSchema)` | Change a user's role |
| `DELETE` | `/users/:id` | `authMiddleware`, `checkRole`, `validate(idValidation, params)` | Delete user |

### Address object shape

```json
{ "city": "string", "street": "string", "houseNumber": 1, "zip": "string" }
```

---

## 4. Product Routes

**Router file:** `server/sec/features/products/products.router.ts`  
**Controller:** `server/sec/features/products/products.controller.ts`  
**Schemas:** `server/sec/features/products/products.schemas.ts`

### Public endpoints

| Method | Path | Query params | Description |
|--------|------|-------------|-------------|
| `GET` | `/products/` | `page`, `limit` (max 50), `sort`, `category`, `minPrice`, `maxPrice`, `search`, `isActive` | Paginated product list |
| `GET` | `/products/:id` | — | Single product |
| `GET` | `/products/category/:cat` | — | Products by category |

### Authenticated endpoints

| Method | Path | Middleware | Description |
|--------|------|-----------|-------------|
| `POST` | `/products/:id/rating` | `authMiddleware`, `validate(ratingSchema)` | Add a rating + comment |

### Admin-only endpoints

| Method | Path | Middleware | Description |
|--------|------|-----------|-------------|
| `POST` | `/products/` | `authMiddleware`, `checkRole`, `uploadProductImage.array('images', 4)` | Create product |
| `PUT` | `/products/:id` | `authMiddleware`, `checkRole`, `uploadProductImage.array('images', 4)` | Update product |
| `DELETE` | `/products/:id` | `authMiddleware`, `checkRole` | Soft-delete (sets `isActive: false`) |

### Valid categories

`electronics` · `clothing` · `food` · `home` · `beauty`

### Rating validation

| Field | Rule |
|-------|------|
| `rating` | Integer 1–5 |
| `comment` | Optional string, 2–500 chars |

### Image upload (Cloudinary)

- Field name: `images`
- Max files: **4**
- Allowed types: jpg, jpeg, png, webp
- Max size: **5 MB** per file
- Folder: `ecommerce/products`

---

## 5. Cart Routes

**Router file:** `server/sec/features/Cart/cart.router.ts`

All endpoints require `authMiddleware`.

| Method | Path | Body | Description |
|--------|------|------|-------------|
| `GET` | `/cart/` | — | Get current cart |
| `POST` | `/cart/` | `{ productId, quantity? }` | Add item (increments if already in cart) |
| `PUT` | `/cart/:productId` | `{ quantity }` | Set quantity for item |
| `DELETE` | `/cart/:productId` | — | Remove one item |
| `DELETE` | `/cart/` | — | Clear entire cart |
| `POST` | `/cart/sync` | `{ items: [{ productId, quantity }] }` | Sync offline/local cart to DB |

---

## 6. Order Routes

**Router file:** `server/sec/features/orders/order.router.ts`  
**Controller:** `server/sec/features/orders/order.controller.ts`  
**Schemas:** `server/sec/features/orders/order.schemas.ts`

All endpoints require `authMiddleware`.

| Method | Path | Middleware | Description |
|--------|------|-----------|-------------|
| `POST` | `/orders/` | `validate(createOrderSchema)` | Place order; decrements stock; sends confirmation email |
| `GET` | `/orders/my-orders` | — | Get caller's orders |
| `GET` | `/orders/:id` | — | Get single order (own orders for customers; any for admin) |
| `GET` | `/orders/` | `checkRole` | **Admin.** All orders, paginated (newest first) |
| `PUT` | `/orders/:id/status` | `checkRole`, `validate(updateOrderStatusSchema)` | **Admin.** Update order status; sends status email |
| `PUT` | `/orders/:id/cancel` | `checkRole` | **Admin.** Cancel pending order; restores stock |

### Create order body

```json
{
  "items": [{ "product": "<productId>", "quantity": 1 }],
  "addressId": "<addressId>",
  "paymentMethod": "credit | paypal | simulated",
  "shippingCost": 0,
  "notes": "optional"
}
```

### Order status flow

```
pending → processing → shipped → delivered
       ↘ cancelled (from pending only)
```

### Payment methods

`credit` · `paypal` · `simulated`

---

## 7. Middleware Reference

### 7.1 `authMiddleware`

**File:** `server/sec/features/auth/auth.middleware.ts`

1. Reads `Authorization: Bearer <token>` header
2. Verifies JWT with `JWT_SECRET`
3. Checks `tokenInvalidatedAt` — rejects if token was issued before logout
4. Attaches `req.user = { userId, email, role }` for downstream handlers
5. Returns **401** on any failure

### 7.2 `checkRole`

Verifies `req.user.role === 'admin'`. Returns **403** otherwise.

### 7.3 `validate(schema, property?)`

**File:** `server/sec/utils/validate.ts`

- Wraps Joi validation; default property is `body`
- Strips unknown fields
- Returns **422** with field-level errors on failure:

```json
{ "status": 422, "message": "Validation error", "data": [{ "field": "email", "message": "..." }] }
```

### 7.4 CORS configuration

**File:** `server/sec/config/cors.config.ts`  
Configured via `CORS_CLIENTS` environment variable.

| Origin | Client type | Methods | Credentials |
|--------|------------|---------|-------------|
| `http://localhost:5173` | storefront | GET POST PUT DELETE | ✅ |
| `http://localhost:3000` | crm | GET POST PUT DELETE PATCH | ✅ |
| `http://mobile-app.com` | mobile | GET POST | ❌ |
| Unknown | — | GET POST | ❌ |

### 7.5 File upload middleware

**File:** `server/sec/config/cloudinary.ts`

| Middleware | Usage | Max files | Folder |
|-----------|-------|-----------|--------|
| `uploadProductImage.array('images', 4)` | Product create/update | 4 | `ecommerce/products` |
| `uploadUserAvatar.single('image')` | Profile update | 1 | `ecommerce/avatars` |

Old avatar is deleted from Cloudinary before the new one is saved.

### 7.6 Rate limiting

| Limiter | Limit | Applied to |
|---------|-------|-----------|
| Global | 100 req / 60 s | All routes |
| Login | 10 req / 60 s | `POST /AuthRoutes/login` |

---

## 8. Error Handling

**File:** `server/shared/utils/errorConrtoller.ts`

`globalErrorHandler` catches all thrown errors and maps them to HTTP responses.

| Error type | HTTP status | Notes |
|-----------|------------|-------|
| `CastError` | 400 | Invalid MongoDB ObjectId in params |
| Duplicate key (code 11000) | 400 | e.g. duplicate email |
| `ValidationError` | 422 | Mongoose schema validation failure |
| JWT invalid / malformed | 401 | |
| JWT expired | 401 | |
| Multer file error | 422 | Wrong type / size exceeded |
| `AppError` | `statusCode` from throw | Application-level errors |
| Unhandled | 500 | Generic server error |

Stack traces are included only when `NODE_ENV === 'development'`.

**Response shape:**
```json
{ "status": "fail | error", "message": "...", "stack": "dev only" }
```

**`catchAsync` wrapper** — wraps async controllers to forward rejections automatically.

---

## 9. Request & Response Shapes

This section documents the complete request and response structure for every API endpoint, organized by feature.

---

### 9.1 Authentication Endpoints

#### Register — `POST /AuthRoutes/register`

**Request body:**
```json
{ "name": "Alice", "email": "alice@example.com", "password": "Secure1234" }
```

**Response 201:**
```json
{
  "status": 201,
  "message": "Verification code sent.",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Alice",
    "email": "alice@example.com",
    "role": "customer",
    "isVerified": false
  }
}
```

**Error 422 — Validation failed:**
```json
{
  "status": 422,
  "message": "Validation error",
  "data": [{ "field": "email", "message": "\"email\" must be a valid email" }]
}
```

**Error 400 — Duplicate email:**
```json
{
  "status": "fail",
  "message": "E11000 duplicate key error collection: ecommerce.users index: email_1"
}
```

---

#### Login — `POST /AuthRoutes/login`

**Request body:**
```json
{ "email": "alice@example.com", "password": "Secure1234" }
```

**Response 200:**
```json
{
  "status": 200,
  "message": "Login successfully",
  "data": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error 400 — Invalid credentials:**
```json
{
  "status": "fail",
  "message": "Invalid credentials"
}
```

**Error 400 — User not verified:**
```json
{
  "status": "fail",
  "message": "User is not verified"
}
```

---

#### Verify Email — `GET /AuthRoutes/verify-email/:rawToken`

**Response 200:**
```json
{
  "message": "Email verified successfully"
}
```

**Error 400 — Invalid/expired token:**
```json
{
  "status": "fail",
  "message": "Invalid or expired verification token"
}
```

---

#### Password Forgot — `POST /AuthRoutes/password-forgot`

**Request body:**
```json
{ "email": "alice@example.com" }
```

**Response 200:**
```json
{
  "status": 200,
  "message": "Reset link sent successfully",
  "data": null
}
```

> **Note:** Returns 200 regardless of whether email exists (prevents email enumeration).

---

#### Password Reset — `POST /AuthRoutes/password-reset/:token`

**Request body:**
```json
{ "password": "NewSecure1234" }
```

**Response 200:**
```json
{
  "status": 200,
  "message": "Password reset successfully",
  "data": null
}
```

**Error 401 — Token invalid/expired:**
```json
{
  "status": "fail",
  "message": "Token invalid or expired"
}
```

---

#### Admin Login — `POST /AuthRoutes/admin/login`

**Request body:**
```json
{ "email": "admin@example.com", "password": "AdminPass1234" }
```

**Response 200:**
```json
{
  "status": 200,
  "message": "2FA code sent to admin email",
  "data": {
    "userId": "507f1f77bcf86cd799439011"
  }
}
```

**Error 400 — Invalid admin credentials:**
```json
{
  "status": "fail",
  "message": "Invalid admin credentials"
}
```

---

#### Admin Verify 2FA — `POST /AuthRoutes/admin/verify-2fa`

**Request body:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "code": "123456"
}
```

**Response 200:**
```json
{
  "status": 200,
  "message": "2FA verified successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error 400 — Invalid 2FA code:**
```json
{
  "status": "fail",
  "message": "Invalid 2FA code"
}
```

**Error 400 — 2FA code expired:**
```json
{
  "status": "fail",
  "message": "2FA code expired or invalid"
}
```

---

#### Logout — `POST /AuthRoutes/logout`

**Response 200:**
```json
{
  "status": 200,
  "message": "User logged out successfully",
  "data": null
}
```

**Error 401 — Unauthorized:**
```json
{
  "status": "fail",
  "message": "Unauthorized"
}
```

---

#### Get Me (Profile) — `GET /AuthRoutes/me`

**Response 200:**
```json
{
  "status": 200,
  "message": "User fetched successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Alice",
    "email": "alice@example.com",
    "role": "customer",
    "isVerified": true,
    "cart": [
      {
        "product": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Product Name",
          "price": 99.99,
          "images": ["url1", "url2"]
        },
        "quantity": 2
      }
    ],
    "addresses": [
      { "_id": "...", "city": "Tel Aviv", "street": "Main St", "houseNumber": 10, "zip": "61000" }
    ]
  }
}
```

**Error 401 — Unauthorized:**
```json
{
  "status": "fail",
  "message": "Unauthorized"
}
```

---

### 9.2 User Management Endpoints

#### Get Profile — `GET /users/profile`

**Response 200:**
```json
{
  "status": 200,
  "message": "User fetched successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Alice",
    "email": "alice@example.com",
    "role": "customer",
    "isVerified": true,
    "image": "https://res.cloudinary.com/...",
    "addresses": []
  }
}
```

**Error 404 — User not found:**
```json
{
  "status": "fail",
  "message": "User not found"
}
```

---

#### Update Profile — `PUT /users/profile`

**Request body (multipart/form-data with optional image file):**
```json
{
  "name": "Alice Updated",
  "email": "alice.new@example.com"
}
```

**Response 200:**
```json
{
  "status": 200,
  "message": "update User Profile successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Alice Updated",
    "email": "alice.new@example.com",
    "image": "https://res.cloudinary.com/...",
    "role": "customer"
  }
}
```

**Error 404 — User not found:**
```json
{
  "status": "fail",
  "message": "User not found"
}
```

---

#### Change Password — `PUT /users/change-password`

**Request body:**
```json
{
  "oldPassword": "OldPass1234",
  "newPassword": "NewPass1234"
}
```

**Response 200:**
```json
{
  "status": 200,
  "message": "Password updated successfully",
  "data": null
}
```

**Error 401 — Old password incorrect:**
```json
{
  "status": "fail",
  "message": "old password is incorrect"
}
```

---

#### Add Address — `POST /users/addresses`

**Request body:**
```json
{
  "city": "Tel Aviv",
  "street": "Main Street",
  "houseNumber": 10,
  "zip": "61000"
}
```

**Response 200:**
```json
{
  "status": 200,
  "message": "Address added successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Alice",
    "email": "alice@example.com",
    "addresses": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "city": "Tel Aviv",
        "street": "Main Street",
        "houseNumber": 10,
        "zip": "61000"
      }
    ]
  }
}
```

**Error 404 — User not found:**
```json
{
  "status": "fail",
  "message": "user not found"
}
```

---

#### Update Address — `PUT /users/addresses/:addrId`

**Request body (all fields optional):**
```json
{
  "city": "Haifa",
  "street": "Updated Street",
  "houseNumber": 20,
  "zip": "31000"
}
```

**Response 200:**
```json
{
  "status": 200,
  "message": "Address updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "addresses": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "city": "Haifa",
        "street": "Updated Street",
        "houseNumber": 20,
        "zip": "31000"
      }
    ]
  }
}
```

**Error 404 — Address not found:**
```json
{
  "status": "fail",
  "message": "address not found"
}
```

---

#### Delete Address — `DELETE /users/addresses/:addrId`

**Response 200:**
```json
{
  "status": 200,
  "message": "Address deleted successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "city": "Tel Aviv",
      "street": "Main Street",
      "houseNumber": 10,
      "zip": "61000"
    }
  ]
}
```

**Error 404 — Address not found:**
```json
{
  "status": 404,
  "message": "Address not found",
  "data": null
}
```

---

#### Get All Users (Admin) — `GET /users/`

**Response 200:**
```json
{
  "status": 200,
  "message": "Users fetched successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Alice",
      "email": "alice@example.com",
      "role": "customer",
      "isVerified": true
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Bob",
      "email": "bob@example.com",
      "role": "admin",
      "isVerified": true
    }
  ]
}
```

**Error 403 — Forbidden (not admin):**
```json
{
  "status": "fail",
  "message": "Forbidden"
}
```

---

#### Update User Role (Admin) — `PUT /users/role/:id`

**Request body:**
```json
{ "role": "admin" }
```

**Response 200:**
```json
{
  "status": 200,
  "message": "Role updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Alice",
    "email": "alice@example.com",
    "role": "admin"
  }
}
```

**Error 400 — Invalid role:**
```json
{
  "status": "fail",
  "message": "Role must be \"admin\" or \"customer\""
}
```

---

#### Delete User (Admin) — `DELETE /users/:id`

**Response 200:**
```json
{
  "status": 200,
  "message": "User deleted successfully",
  "data": null
}
```

**Error 404 — User not found:**
```json
{
  "status": "fail",
  "message": "user not found"
}
```

---

### 9.3 Product Endpoints

#### Get Products (List) — `GET /products/`

**Query parameters:**
- `page` (default: 1)
- `limit` (default: 10, max: 50)
- `sort` (e.g., `price,-name`)
- `category` (electronics, clothing, food, home, beauty)
- `minPrice` (number)
- `maxPrice` (number)
- `search` (searches name and description)
- `isActive` (true/false, default: true)

**Response 200:**
```json
{
  "status": "success",
  "results": 10,
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalProducts": 50,
    "limit": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "data": {
    "products": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Laptop",
        "description": "High-performance laptop",
        "price": 1299.99,
        "category": "electronics",
        "images": ["url1", "url2"],
        "stock": 10,
        "sold": 5,
        "averageRating": 4.5,
        "isActive": true
      }
    ]
  }
}
```

**Error 400 — Invalid sort parameter:**
```json
{
  "status": "fail",
  "message": "sortBy must be a string"
}
```

---

#### Get Single Product — `GET /products/:id`

**Response 200:**
```json
{
  "status": "success",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Laptop",
    "description": "High-performance laptop",
    "price": 1299.99,
    "category": "electronics",
    "images": ["url1", "url2"],
    "stock": 10,
    "sold": 5,
    "averageRating": 4.5,
    "ratings": [
      {
        "_id": "...",
        "user": "507f1f77bcf86cd799439011",
        "rating": 5,
        "comment": "Excellent product!"
      }
    ],
    "isActive": true
  }
}
```

**Error 404 — Product not found:**
```json
{
  "status": "fail",
  "message": "No product found with that ID"
}
```

---

#### Get Products by Category — `GET /products/category/:cat`

**Response 200:**
```json
{
  "status": "success",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Laptop",
      "price": 1299.99,
      "category": "electronics",
      "images": ["url1"],
      "averageRating": 4.5
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Monitor",
      "price": 399.99,
      "category": "electronics",
      "images": ["url1"],
      "averageRating": 4.0
    }
  ]
}
```

**Error 404 — Category not found:**
```json
{
  "status": "fail",
  "message": "No items found in category: invalid"
}
```

---

#### Create Product (Admin) — `POST /products/`

**Request body (multipart/form-data with up to 4 image files):**
```json
{
  "name": "New Product",
  "description": "Product description",
  "price": 99.99,
  "category": "electronics",
  "stock": 20
}
```

**Response 201:**
```json
{
  "status": "success",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "name": "New Product",
    "description": "Product description",
    "price": 99.99,
    "category": "electronics",
    "stock": 20,
    "sold": 0,
    "images": ["https://res.cloudinary.com/..."],
    "averageRating": 0,
    "isActive": true,
    "ratings": []
  }
}
```

**Error 403 — Forbidden (not admin):**
```json
{
  "status": "fail",
  "message": "Forbidden"
}
```

---

#### Update Product (Admin) — `PUT /products/:id`

**Request body (multipart/form-data, all fields optional):**
```json
{
  "name": "Updated Product Name",
  "price": 149.99,
  "stock": 25
}
```

> **Note:** Fields `sold`, `ratings`, `averageRating` cannot be updated directly.

**Response 200:**
```json
{
  "status": "success",
  "data": {
    "product": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Updated Product Name",
      "price": 149.99,
      "stock": 25,
      "category": "electronics",
      "images": ["https://res.cloudinary.com/..."],
      "averageRating": 4.5
    }
  }
}
```

**Error 404 — Product not found:**
```json
{
  "status": "fail",
  "message": "No product found with that ID"
}
```

---

#### Delete Product (Admin) — `DELETE /products/:id`

**Response 200:**
```json
{
  "status": "success",
  "message": "Product deactivated successfully",
  "data": {
    "product": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Laptop",
      "isActive": false
    }
  }
}
```

**Error 404 — Product not found:**
```json
{
  "status": "fail",
  "message": "No product found with that ID"
}
```

---

#### Add Product Rating — `POST /products/:id/rating`

**Request body:**
```json
{
  "rating": 5,
  "comment": "Excellent product, highly recommended!"
}
```

**Response 201:**
```json
{
  "status": "success",
  "data": {
    "averageRating": 4.7,
    "ratings": [
      {
        "_id": "507f1f77bcf86cd799439015",
        "user": "507f1f77bcf86cd799439011",
        "rating": 5,
        "comment": "Excellent product, highly recommended!"
      },
      {
        "_id": "507f1f77bcf86cd799439016",
        "user": "507f1f77bcf86cd799439012",
        "rating": 4,
        "comment": "Good quality"
      }
    ]
  }
}
```

**Error 404 — Product not found:**
```json
{
  "status": "fail",
  "message": "No product found with that ID"
}
```
**Error 404 — cant review twice:**
```json
{
  "status": "fail",
  "message": "you alredy Review this product"
}
```

---

### 9.4 Cart Endpoints

#### Get Cart — `GET /cart/`

**Response 200:**
```json
{
  "status": 200,
  "message": "get Cart successfully",
  "data": [
    {
      "product": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Laptop",
        "price": 1299.99,
        "images": ["url1", "url2"]
      },
      "quantity": 1,
      "_id": "507f1f77bcf86cd799439020"
    },
    {
      "product": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Mouse",
        "price": 29.99,
        "images": ["url1"]
      },
      "quantity": 2,
      "_id": "507f1f77bcf86cd799439021"
    }
  ]
}
```

**Error 404 — User not found:**
```json
{
  "status": "fail",
  "message": "User not found"
}
```

---

#### Add Item to Cart — `POST /cart/`

**Request body:**
```json
{
  "productId": "507f1f77bcf86cd799439012",
  "quantity": 1
}
```

> **Note:** If product already in cart, quantity is incremented.

**Response 200:**
```json
{
  "status": 200,
  "message": "Product added to cart",
  "data": [
    {
      "product": "507f1f77bcf86cd799439012",
      "quantity": 2,
      "_id": "507f1f77bcf86cd799439020"
    }
  ]
}
```

**Error 404 — Product not found:**
```json
{
  "status": "fail",
  "message": "Product not found"
}
```

---

#### Update Cart Item — `PUT /cart/:productId`

**Request body:**
```json
{ "quantity": 3 }
```

**Response 200:**
```json
{
  "status": 200,
  "message": "Cart item updated successfully",
  "data": [
    {
      "product": "507f1f77bcf86cd799439012",
      "quantity": 3,
      "_id": "507f1f77bcf86cd799439020"
    }
  ]
}
```

**Error 404 — Product not in cart:**
```json
{
  "status": "fail",
  "message": "Product not found in cart"
}
```

---

#### Remove Item from Cart — `DELETE /cart/:productId`

**Response 200:**
```json
{
  "status": 200,
  "message": "product deleted successfully",
  "data": [
    {
      "product": "507f1f77bcf86cd799439013",
      "quantity": 2,
      "_id": "507f1f77bcf86cd799439021"
    }
  ]
}
```

**Error 404 — Product not in cart:**
```json
{
  "status": "fail",
  "message": "Product not found in cart"
}
```

---

#### Clear Cart — `DELETE /cart/`

**Response 200:**
```json
{
  "status": 200,
  "message": "postCart successfully",
  "data": []
}
```

**Error 404 — User not found:**
```json
{
  "status": "fail",
  "message": "User not found"
}
```

---

#### Sync Cart — `POST /cart/sync`

**Request body:**
```json
{
  "items": [
    { "product": "507f1f77bcf86cd799439012", "quantity": 1 },
    { "product": "507f1f77bcf86cd799439013", "quantity": 2 }
  ]
}
```

**Response 200:**
```json
{
  "status": 200,
  "message": "Products added to cart",
  "data": [
    {
      "product": "507f1f77bcf86cd799439012",
      "quantity": 1,
      "_id": "507f1f77bcf86cd799439020"
    },
    {
      "product": "507f1f77bcf86cd799439013",
      "quantity": 2,
      "_id": "507f1f77bcf86cd799439021"
    }
  ]
}
```

**Error 400 — Invalid items:**
```json
{
  "status": "fail",
  "message": "Items must be a non-empty array"
}
```

---

### 9.5 Order Endpoints

#### Create Order — `POST /orders/`

**Request body:**
```json
{
  "items": [
    { "product": "507f1f77bcf86cd799439012", "quantity": 1 },
    { "product": "507f1f77bcf86cd799439013", "quantity": 2 }
  ],
  "addressId": "507f1f77bcf86cd799439030",
  "paymentMethod": "credit",
  "shippingCost": 10,
  "notes": "Handle with care"
}
```

**Response 201:**
```json
{
  "status": "success",
  "data": {
    "_id": "507f1f77bcf86cd799439040",
    "user": "507f1f77bcf86cd799439011",
    "items": [
      {
        "product": "507f1f77bcf86cd799439012",
        "name": "Laptop",
        "price": 1299.99,
        "image": "url1",
        "quantity": 1
      },
      {
        "product": "507f1f77bcf86cd799439013",
        "name": "Mouse",
        "price": 29.99,
        "image": "url1",
        "quantity": 2
      }
    ],
    "shippingAddress": {
      "city": "Tel Aviv",
      "street": "Main Street",
      "houseNumber": 10,
      "zip": "61000"
    },
    "paymentMethod": "credit",
    "totalprice": 1359.97,
    "orderStatus": "pending",
    "notes": "Handle with care",
    "createdAt": "2026-05-19T10:30:00Z"
  }
}
```

**Error 400 — Insufficient stock:**
```json
{
  "status": "fail",
  "message": "Insufficient stock for \"Laptop\""
}
```

**Error 400 — Empty items:**
```json
{
  "status": "fail",
  "message": "An order must contain at least one item."
}
```

---

#### Get My Orders — `GET /orders/my-orders`

**Response 200:**
```json
{
  "status": "success",
  "results": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439040",
      "user": "507f1f77bcf86cd799439011",
      "items": [
        {
          "product": "507f1f77bcf86cd799439012",
          "name": "Laptop",
          "price": 1299.99,
          "quantity": 1
        }
      ],
      "totalprice": 1309.99,
      "orderStatus": "pending",
      "createdAt": "2026-05-19T10:30:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439041",
      "user": "507f1f77bcf86cd799439011",
      "items": [
        {
          "product": "507f1f77bcf86cd799439013",
          "name": "Mouse",
          "price": 29.99,
          "quantity": 2
        }
      ],
      "totalprice": 69.98,
      "orderStatus": "delivered",
      "createdAt": "2026-05-18T14:00:00Z"
    }
  ]
}
```

---

#### Get Single Order — `GET /orders/:id`

**Response 200:**
```json
{
  "status": "success",
  "data": {
    "_id": "507f1f77bcf86cd799439040",
    "user": "507f1f77bcf86cd799439011",
    "items": [
      {
        "product": "507f1f77bcf86cd799439012",
        "name": "Laptop",
        "price": 1299.99,
        "image": "url1",
        "quantity": 1
      }
    ],
    "shippingAddress": {
      "city": "Tel Aviv",
      "street": "Main Street",
      "houseNumber": 10,
      "zip": "61000"
    },
    "paymentMethod": "credit",
    "totalprice": 1309.99,
    "orderStatus": "pending",
    "createdAt": "2026-05-19T10:30:00Z"
  }
}
```

**Error 404 — Order not found:**
```json
{
  "status": "fail",
  "message": "No order found with ID: 507f1f77bcf86cd799439099"
}
```

**Error 403 — Unauthorized:**
```json
{
  "status": "fail",
  "message": "Unauthorized"
}
```

---

#### Get All Orders (Admin) — `GET /orders/`

**Query parameters:**
- `page` (default: 1)
- `limit` (default: 10, max: 50)

**Response 200:**
```json
{
  "status": "success",
  "results": 2,
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalOrders": 2,
    "limit": 10,
    "hasNextPage": false,
    "hasPrevPage": false
  },
  "data": [
    {
      "_id": "507f1f77bcf86cd799439040",
      "user": "507f1f77bcf86cd799439011",
      "items": [
        {
          "product": "507f1f77bcf86cd799439012",
          "name": "Laptop",
          "price": 1299.99,
          "quantity": 1
        }
      ],
      "totalprice": 1309.99,
      "orderStatus": "pending"
    }
  ]
}
```

**Error 403 — Forbidden (not admin):**
```json
{
  "status": "fail",
  "message": "Forbidden"
}
```

---

#### Update Order Status (Admin) — `PUT /orders/:id/status`

**Request body:**
```json
{ "orderStatus": "shipped" }
```

> **Valid statuses:** `pending`, `processing`, `shipped`, `delivered`, `cancelled`

**Response 200:**
```json
{
  "status": "success",
  "data": {
    "_id": "507f1f77bcf86cd799439040",
    "user": "507f1f77bcf86cd799439011",
    "items": [
      {
        "product": "507f1f77bcf86cd799439012",
        "name": "Laptop",
        "price": 1299.99,
        "quantity": 1
      }
    ],
    "totalprice": 1309.99,
    "orderStatus": "shipped"
  }
}
```

**Error 404 — Order not found:**
```json
{
  "status": "fail",
  "message": "No orders found with ID: 507f1f77bcf86cd799439099"
}
```

---

#### Cancel Order (Admin) — `PUT /orders/:id/cancel`

**Response 200:**
```json
{
  "status": "success",
  "data": {
    "_id": "507f1f77bcf86cd799439040",
    "user": "507f1f77bcf86cd799439011",
    "items": [
      {
        "product": "507f1f77bcf86cd799439012",
        "name": "Laptop",
        "price": 1299.99,
        "quantity": 1
      }
    ],
    "totalprice": 1309.99,
    "orderStatus": "cancelled"
  }
}
```

**Error 400 — Cannot cancel non-pending order:**
```json
{
  "status": "fail",
  "message": "Order 507f1f77bcf86cd799439040 cannot be cancelled because it is no longer pending."
}
```

**Error 404 — Order not found:**
```json
{
  "status": "fail",
  "message": "No order found with ID: 507f1f77bcf86cd799439099"
}
```

---

### General Error Responses

#### Validation Error — `422`

```json
{
  "status": 422,
  "message": "Validation error",
  "data": [
    { "field": "email", "message": "\"email\" must be a valid email" },
    { "field": "password", "message": "\"password\" must be at least 8 characters" }
  ]
}
```

#### Unauthorized — `401`

```json
{
  "status": "fail",
  "message": "Unauthorized"
}
```

#### Not Found — `404`

```json
{
  "status": "fail",
  "message": "Resource not found"
}
```

#### Server Error — `500`

```json
{
  "status": "error",
  "message": "Internal server error",
  "stack": "only in development"
}
```

---

## 10. Security Summary

| Feature | Implementation |
|---------|---------------|
| Password hashing | bcryptjs, 10 salt rounds |
| JWT (users) | 7-day expiry |
| JWT (admins) | 1-hour expiry, requires 2FA |
| Token invalidation | `tokenInvalidatedAt` timestamp checked on every request |
| Admin 2FA | 6-digit code via email, 5-minute expiry |
| Password reset tokens | Hashed, 15-minute expiry |
| Rate limiting | Global 100/min + 10/min on login |
| File uploads | Type + size validated before Cloudinary upload |
| CORS | Per-client-type granular config |
| Security headers | helmet (CSP, HSTS, etc.) |
| Soft deletes | Products set `isActive: false`, not hard-deleted |
| Error leakage | Stack traces in `development` only |

---

## 11. Environment Variables

| Variable | Purpose |
|----------|---------|
| `PORT` | Server port (default 3001) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `NODE_ENV` | `development` / `production` |
| `JWT_SECRET` | JWT signing secret |
| `CLOUDINARY_CLOUDE_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `CLOUDINARY_URL` | Full Cloudinary connection URL |
| `EMAIL_USER` | Gmail sender address |
| `EMAIL_PASS` | Gmail app password |
| `CORS_CLIENTS` | JSON map of origin → client type |
