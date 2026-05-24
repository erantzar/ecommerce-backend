import Product from './products.model.js';
import { catchAsync } from '../../../shared/middleware/catchAsync.js';
import AppError from '../../../shared/utils/appError.js';
import { RequestHandler } from 'express';
import { IProduct, IProductDocument, IRating } from '../../types/products.types.js';

/**
 * @desc    Create a new product
 * @route   POST http://localhost:3000/products
 * @access  Admin
 */

export const createProduct: RequestHandler = catchAsync(async (req, res, next) => {

    // req.files is an array when using .array()
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
        req.body.images = files.map(file => file.path); //array of cloudinary URLs
    }
    const newProduct = await Product.create(req.body);
    console.log(newProduct._id);

    res.status(201).json({
        status: 'success',
        data: newProduct,
    });
});

/**
 * @desc    Get all products with pagination, filtering and sorting
 * @route   GET http://localhost:3000/products
 * @access  Public
 */

export const getAllProducts: RequestHandler = catchAsync(async (req, res, next) => {

    interface ProductFilter {
        category?: any;
        isActive?: any;
        page?: number;
        limit?: number;
        $or?: Array<{ [key: string]: { $regex: string; $options: string } | any; }>;
        price?: { $gte?: number; $lte?: number };
        name?: { $regex: string; $options: string }; // For search

    }
    const {
        page = 1,
        limit = 10,
        sort,
        category,
        minPrice,
        maxPrice,
        search,
        isActive
    } = req.query;

    // ── 1. BUILD FILTER OBJECT ──────────────────────────────────────
    const filter: ProductFilter = {};

    // Filter by category
    if (category) {
        filter.category = category;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Filter by active status (default: show only active products)
    if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
    } else {
        filter.isActive = true;
    }

    // Search by name or description
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    // ── 2. BUILD SORT OBJECT ────────────────────────────────────────
    // Default: newest first
    let sortBy: string = '-createdAt';
    if (sort) {
        if (typeof sort !== 'string') {
            return next(new AppError('sortBy must be a string', 400))
        }
        sortBy = sort.split(',').join(' ');
    }
    // Converts "price,-name" -> "price -name"
    
    // ── 3. PAGINATION ───────────────────────────────────────────────
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit))); // max 50 per page
    const skip = (pageNum - 1) * limitNum;

    // ── 4. EXECUTE QUERY ────────────────────────────────────────────
    const [products, totalProducts] = await Promise.all([
        Product.find(filter)
            .sort(sortBy)
            .skip(skip)
            .limit(limitNum)
            .select('-ratings')
            .lean(), // exclude the full ratings array for performance
        Product.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalProducts / limitNum);

    // ── 5. SEND RESPONSE ────────────────────────────────────────────
    res.status(200).json({
        status: 'success',
        results: products.length,
        pagination: {
            currentPage: pageNum,
            totalPages,
            totalProducts,
            limit: limitNum,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1
        },
        data: {
            products
        }
    });

});

/**
 * @desc    Get a single product by ID
 * @route   GET http://localhost:3000/products/:id
 * @access  Public
 */

export const getProductById: RequestHandler = catchAsync(async (req, res, next) => {
    const { id } = req.params

    const product = await Product.findById(id)
        .populate<{ ratings: Array<{ user: { _id: string; name: string } | string; rating: number; comment?: string; createdAt: Date }> }>(
            'ratings.user', 'name'
        )
        .lean();
    if (!product) {
        return next(new AppError('No product found with that ID', 404))
    }

    res.status(200).json({
        status: 'success',
        data: product
    })
})

/**
 * @desc    Get all products by category
 * @route   GET http://localhost:3000/products/:category/category
 * @access  Public 
 */

export const getProductByCategory: RequestHandler = catchAsync(async (req, res, next) => {
    const { cat } = req.params

    if (!cat || cat == "") {

        return next(new AppError('category is requierd', 404))
    }
    const products = await Product.find({ category: cat }).lean()

    if (products.length === 0) {
        return next(new AppError(`No items found in category: ${cat}`, 404));
    }

    res.status(200).json({
        status: 'success',
        data: products
    })
})

/**
 * @desc    Create new rating for product by id
 * @route   GET http://localhost:3000/products/:id/rating
 * @access  Confrimed User
 */

export const addProductRating: RequestHandler = catchAsync(async (req, res, next) => {
    const { rating, comment } = req.body;
    const productId = req.params.id;
    const userId = req.user!.userId; // Safely pulled from your auth middleware

    const product: IProductDocument | null = await Product.findById(productId);

    if (!product) {
        return next(new AppError('No product found with that ID', 404));
    }

    // 1. Find if this user has already reviewed the product
    const existingReviewIndex = product.ratings.findIndex(
        (rev) => rev.user.toString() === userId.toString()
    );

    if (existingReviewIndex > -1) {
        // 2A. If they already voted, update their existing review instead of adding a new one
        return(next(new AppError('you alredy Review this product', 404)))
    } else {
        // 2B. If it's a brand new user voting, push the new rating object
        const newRating: IRating = {
            rating: Number(rating),
            comment: String(comment),
            user: userId
        };
        product.ratings.push(newRating);
    }

    //Simple math to update averageRating
    const totalRatings = product.ratings.length;
    const sumRatings = product.ratings.reduce((acc, item) => item.rating + acc, 0);
    product.averageRating = sumRatings / totalRatings;

    await product.save();

    res.status(201).json({
        status: 'success',
        data: {
            averageRating: product.averageRating,
            ratings: product.ratings
        }
    });
});

/**
 * @desc    Update an existing rating left by the current user
 * @route   PATCH /products/:id/rating
 * @access  Authenticated User
 */

export const updateProductRating: RequestHandler = catchAsync(async (req, res, next) => {
    const { rating, comment } = req.body;
    const productId = req.params.id;
    const userId = req.user!.userId;

    const product: IProductDocument | null = await Product.findById(productId);
    if (!product) {
        return next(new AppError('No product found with that ID', 404));
    }

    const existingReview = product.ratings.find(
        (r) => r.user.toString() === userId.toString()
    );
    if (!existingReview) {
        return next(new AppError('You have not reviewed this product yet', 404));
    }

    if (rating !== undefined) existingReview.rating = Number(rating);
    if (comment !== undefined) existingReview.comment = String(comment);

    const sum = product.ratings.reduce((acc, r) => acc + r.rating, 0);
    product.averageRating = sum / product.ratings.length;

    await product.save();

    res.status(200).json({
        status: 'success',
        data: {
            averageRating: product.averageRating,
            ratings: product.ratings,
        },
    });
});

/**
 * @desc    Delete a specific review by rating ID (admin only)
 * @route   DELETE /products/:id/rating/:ratingId
 * @access  Admin
 */

export const deleteProductRating: RequestHandler = catchAsync(async (req, res, next) => {
    const { id, ratingId } = req.params;

    const product: IProductDocument | null = await Product.findById(id);
    if (!product) {
        return next(new AppError('No product found with that ID', 404));
    }

    const ratingIndex = product.ratings.findIndex(
        (r) => r._id?.toString() === ratingId
    );
    if (ratingIndex === -1) {
        return next(new AppError('Rating not found', 404));
    }

    product.ratings.splice(ratingIndex, 1);

    if (product.ratings.length > 0) {
        const sum = product.ratings.reduce((acc, r) => acc + r.rating, 0);
        product.averageRating = sum / product.ratings.length;
    } else {
        product.averageRating = 0;
    }

    await product.save();

    res.status(200).json({
        status: 'success',
        data: {
            averageRating: product.averageRating,
            ratings: product.ratings,
        },
    });
});

/**
 * @desc    Update a product
 * @route   PUT http://localhost:3000/products/:id
 * @access  Admin
 */

export const updateProduct: RequestHandler = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    // Fields that should never be updated directly
    const forbiddenFields = ['sold', 'ratings', 'averageRating'];
    forbiddenFields.forEach(field => delete req.body[field]);

    const files = req.files as Express.Multer.File[];
    const newUploads = files && files.length > 0 ? files.map(f => f.path) : [];
    const hasExistingField = 'existingImages' in req.body;
    const rawKept = req.body.existingImages;
    const kept: string[] = hasExistingField
        ? (Array.isArray(rawKept) ? rawKept : [rawKept]).filter(Boolean)
        : [];
    delete req.body.existingImages;

    // Update images if client explicitly sent existingImages (even empty = intentional clear)
    if (hasExistingField || newUploads.length > 0) {
        req.body.images = [...kept, ...newUploads];
    }

    const product = await Product.findByIdAndUpdate(
        id,
        req.body,
        {
            returnDocument: 'after', // return the updated document, not the old one
            runValidators: true      // run schema validators on the new values
        }
    );

    if (!product) {
        return next(new AppError('No product found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: { product }
    });
});

/**
* @desc    Soft delete a product (sets isActive to false)
* @route   DELETE http://localhost:3000/products/:id
* @access  Admin
*/

export const deleteProduct: RequestHandler = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const product = await Product.findByIdAndUpdate(
        id,
        { isActive: false },
        { returnDocument: 'after' }
    );

    if (!product) {
        return next(new AppError('No product found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        message: 'Product deactivated successfully',
        data: { product }
    });
});
