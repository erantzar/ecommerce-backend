import express from "express";
import connectDB from "./sec/config/db.js";
import "dotenv/config";
import router from './sec/features/users/user.router.js'
import AuthRoutes from './sec/features/auth/auth.router.js'
import ProductsRoutes from './sec/features/products/products.router.js'
import OrderRoutes from './sec/features/orders/order.router.js'
import rateLimit from 'express-rate-limit'
import {globalErrorHandler} from './shared/utils/errorConrtoller.js'
import helmet from 'helmet';
import cors from 'cors'
import corsOptions from "./sec/config/cors.config.js";
import cartRoutes from "./sec/features/Cart/cart.router.js";

// Validate required environment variables at startup
const requiredEnv = ['JWT_SECRET', 'MONGO_URI', 'STOREFRONT_URL', 'CRM_URL'] as const;
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const app = express();

app.use(express.json());

app.use(cors(corsOptions));

// Prevent browsers from caching API responses.
// Without this, Express's automatic ETag headers cause browsers to serve
// stale data (old stock counts, outdated order status, etc.) on soft reloads.
app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "default-src": ["'self'"],
        "img-src": ["'self'", "data:", "res.cloudinary.com"],
      },
    },
  })
);

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests, please try again in 1 minute"
});

// we add this when using rate limit behind proxy
app.set("trust proxy", 1)
app.use(limiter);

app.use("/api/v1/users", router);
app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/products", ProductsRoutes);
app.use("/api/v1/orders", OrderRoutes);
app.use("/api/v1/cart", cartRoutes);

app.use((_, res) => {
  console.log("404 - Not Found");
  res.status(404).json({ message: "Route not found" });
});

app.use(globalErrorHandler);

const PORT = process.env.PORT || 3000;

const start = async () => {
  try {
    await connectDB();
    console.log("DB connected");

    app.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`)
    );

  } catch (error: any) {
    console.error("Server failed to start:", error.message);
    process.exit(1);
  }
};

start();
