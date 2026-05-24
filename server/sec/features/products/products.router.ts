import {
    createProduct,
    addProductRating,
    updateProductRating,
    deleteProductRating,
    getAllProducts,
    getProductById,
    getProductByCategory,
    updateProduct,
    deleteProduct
} from "./products.controller.js";
import express, { Router } from 'express';
import { validate } from "../../utils/validate.js";
import { authMiddleware, checkRole } from "../auth/auth.middleware.js";
import { createProductSchema, updateProductSchema, ratinigSchema } from "./products.schemas.js";
import { uploadProductImage } from "../../config/cloudinary.js";


const routerProduct: Router = express.Router();

routerProduct.post('/', authMiddleware, checkRole, validate(createProductSchema), uploadProductImage.array('images', 4), createProduct);
routerProduct.post('/:id/rating', authMiddleware, validate(ratinigSchema), addProductRating);
routerProduct.patch('/:id/rating', authMiddleware, validate(ratinigSchema), updateProductRating);
routerProduct.delete('/:id/rating/:ratingId', authMiddleware, checkRole, deleteProductRating);
routerProduct.get('/', getAllProducts);
routerProduct.get('/category/:cat', getProductByCategory);
routerProduct.get('/:id', getProductById);
routerProduct.put('/:id', authMiddleware, checkRole, validate(updateProductSchema), uploadProductImage.array('images', 4), updateProduct);
routerProduct.delete('/:id', authMiddleware, checkRole, deleteProduct);

export default routerProduct

