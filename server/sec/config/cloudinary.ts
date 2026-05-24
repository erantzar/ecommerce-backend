import "dotenv/config"; 
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer, { Multer } from 'multer';
import AppError from '../../shared/utils/appError.js';
import { FileFilterCallback } from 'multer';
import { Request } from "express";

// ─── Cloudinary Config ────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUDE_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Shared Config ────────────────────────────────────────────
const fileSizeLimit = 5 * 1024 * 1024; // 5MB in bytes

// Define the interface for the params to help TS understand the folder and formats
interface CloudinaryParams {
  folder: string;
  allowed_formats: string[];
  // You can add other properties like transformation here
}

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only jpg, png and webp images are allowed.', 400) as any, false);
  }
};

// ─── Product Images Storage ───────────────────────────────────
const productStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ecommerce/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 800, height: 800, crop: 'fill', gravity: 'auto' },
      { quality: 'auto' },
      { fetch_format: 'auto' },
    ],
  } as CloudinaryParams,
});

// ─── User Avatar Storage ──────────────────────────────────────
const userStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ecommerce/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
  } as CloudinaryParams,
});

// ─── Multer Instances ─────────────────────────────────────────
export const uploadProductImage: Multer = multer({
  storage: productStorage,
  limits: { fileSize: fileSizeLimit },
  fileFilter,
});

export const uploadUserAvatar: Multer = multer({
  storage: userStorage,
  limits: { fileSize: fileSizeLimit },
  fileFilter,
});

export default cloudinary; 