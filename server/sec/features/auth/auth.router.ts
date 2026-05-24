import express, { Router } from 'express';
import {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  resendVerification,
  adminLogin,
  verify2FA,
  logout
} from './auth.controller.js';
import {validate } from '../../utils/validate.js'
import {forgotPasswordSchema,
   loginSchema,
   registerSchema,
    resetPasswordSchema,
     verify2FASchema}
      from './auth.schema.js'
import rateLimit from "express-rate-limit";
import { authMiddleware } from './auth.middleware.js';

const limiterLogIn = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many login attempts, please try again in 1 minute"
});

const limiterAdminLogin = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many admin login attempts, please try again in 1 minute"
});

// Resend verification: max 3 requests per email per 10 minutes
const limiterResendVerification = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many resend requests, please wait 10 minutes before trying again"
});

const AuthRoutes: Router = express.Router();

AuthRoutes.post('/register', validate(registerSchema), register);

AuthRoutes.post('/login', limiterLogIn, validate(loginSchema), login);

AuthRoutes.get('/verify-email/:rawToken', verifyEmail);

AuthRoutes.post('/password-forgot', validate(forgotPasswordSchema), forgotPassword);

// Reuses forgotPasswordSchema — same shape: { email: string }
AuthRoutes.post('/resend-verification', limiterResendVerification, validate(forgotPasswordSchema), resendVerification);

AuthRoutes.post('/password-reset/:token', validate(resetPasswordSchema), resetPassword);

// Admin login gets its own stricter rate limiter
AuthRoutes.post('/admin/login', limiterAdminLogin, validate(loginSchema), adminLogin);

AuthRoutes.post('/admin/verify-2fa', validate(verify2FASchema), verify2FA);

AuthRoutes.post('/logout', logout);

export default AuthRoutes;
