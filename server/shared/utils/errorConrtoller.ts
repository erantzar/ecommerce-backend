import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { MulterError } from 'multer';
import { Error as MongooseError } from 'mongoose'
import AppError from "./appError.js";



// --- HELPER TRANSLATORS ---

//Handles "CastError" (Invalid IDs like /users/123)
const handleCastErrorDB = (err: MongooseError.CastError) => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
};

//Handles "Duplicate Fields" (Email already exists - 11000)
const handleDuplicateFieldsDB = (err: any) => {
    const value = Object.values(err.keyValue)[0];
    const message = `Duplicate field value: "${value}". Please use another value!`;
    return new AppError(message, 409); // 409 = Conflict
};

//Handles "ValidationError" (Schema requirements not met)
const handleValidationErrorDB = (err: MongooseError.ValidationError) => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

//Handles JWT Errors 
const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401);
const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again.', 401);

//Handles Multer Errors (when the file is too large)
const handleMulterError = (err: MulterError) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return new AppError('Image size must be less than 5MB.', 400);
    }else if (err.code === 'LIMIT_UNEXPECTED_FILE'){
        return new AppError('you can upload only one profile image', 400);
    }else {
        return new AppError('Multer File Error', 400);
    }

    
  };
  



// --- THE MAIN HANDLER ---

export const globalErrorHandler: ErrorRequestHandler = (err, req , res, next) => {

    const projectFolderName = 'E-Commerce-Backend';
    const pathRegex = new RegExp(`.*${projectFolderName}`, 'g');
    
    
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Start with a copy of the original error
    let error = Object.assign(err);
    error.message = err.message;

    // Detect and translate specific MongoDB/Mongoose errors
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (error.name === 'MulterError') error = handleMulterError(error);

    
    // Only expose stack traces in development — never in production
    const isDev = process.env.NODE_ENV === 'development';
    let stack: string[] | undefined;
    if (isDev && err.stack) {
        stack = err.stack
            .replace(pathRegex, projectFolderName)
            .split('\n')
            .map((line: string) => line.trim());
    }

    res.status(error.statusCode).json({
        status: error.status,
        message: error.message,
        ...(isDev && { stack })
    });
    
    
};