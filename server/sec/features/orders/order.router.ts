import express, { Router } from 'express'
import {validate} from '../../utils/validate.js'
import { createOrderSchema, updateOrderStatusSchema } from './order.schemas.js';
import { cancelMyOrder, cancelOrder, createOrder, getAllOrders, getOrderStats, myOrders, singelOrderById, updateStatus } from './order.controller.js';
import { authMiddleware, checkRole } from "../auth/auth.middleware.js";


const router: Router = express.Router();

router.post('/', authMiddleware, validate(createOrderSchema), createOrder);

router.get('/my-orders', authMiddleware, myOrders);

router.get('/stats', authMiddleware, checkRole, getOrderStats);

router.get('/:id', authMiddleware, singelOrderById);

router.get('/', authMiddleware, checkRole, getAllOrders);

router.put('/:id/status', authMiddleware, checkRole, validate(updateOrderStatusSchema), updateStatus);

// Customer cancels their own pending order — no checkRole, ownership verified in handler
router.patch('/:id/cancel', authMiddleware, cancelMyOrder);

// Admin force-cancels any order
router.put('/:id/cancel', authMiddleware, checkRole, cancelOrder);


export default router;