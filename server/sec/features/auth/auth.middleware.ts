import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import User from "../users/user.model.js"
import {RequestHandler} from "express"
import { catchAsync } from "../../../shared/middleware/catchAsync.js"

import AppError from "../../../shared/utils/appError.js"

dotenv.config()

export const authMiddleware: RequestHandler = catchAsync(

    async (req, res, next) => {
        const authHeader = req.headers.authorization;
        

        if (!authHeader || !authHeader.startsWith("Bearer")) {
            return next(new AppError('no token provide!', 401));
        }

        const token = authHeader.split(" ")[1]

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (typeof decoded === 'string') {
            return next(new AppError('Invalid token payload', 401));
        }

        const user = await User.findById(decoded.userId).select('+tokenInvalidatedAt').lean();
        if (user?.tokenInvalidatedAt && decoded.iat! < user.tokenInvalidatedAt.getTime() / 1000) {
            return next(new AppError('Token has been invalidated. Please log in again.', 401));
        }

        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role
        };
        next()

    }
)
export const checkPermissions: RequestHandler = catchAsync(

    async (req, res, next) => {
        const userIdFromToken = req.user!.userId
        const userIdFromUrl = req.params.id
    
        if (String(userIdFromToken) !== String(userIdFromUrl)) {
            return next(new AppError("No permission", 401))
        }
        next();
    }
    
)
export const checkRole: RequestHandler = (req, res, next) => {
    if (req.user?.role !== "admin") {
        return next(new AppError("Access denied", 403));
    }
    next();
}
