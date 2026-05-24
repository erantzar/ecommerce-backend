import { RequestHandler } from "express";
import Product from "../products/products.model.js";
import User from "../users/user.model.js";
import { catchAsync } from "../../../shared/middleware/catchAsync.js";
import AppError from "../../../shared/utils/appError.js";


/**
 * @desc    get user cart
 * @route   Get /cart
 * @access  confrimed user
 */
export const getCart: RequestHandler = catchAsync(

  async (req, res, next) => {

    const id = req.user!.userId;
    // 1. Fetch the user and populate the 'product' field inside the 'cart' array
    const user = await User.findById(id).populate({
      path: 'cart.product',          // The path to the field referencing the Product model
      select: 'name price images'    // Only pull the specific fields you need for the frontend UI
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // 2. Return the populated cart data
    res.status(200).json({
      status: 200,
      message: "get Cart successfully",
      data: user.cart
    });
  }
)

/**
 * @desc    add item to cart
 * @route   Post /cart
 * @access  confrimed user
 */
export const addItemsToCart: RequestHandler = catchAsync(

  async (req, res, next) => {

    const userId = req.user!.userId;
    const { productId, quantity = 1 } = req.body;

    const user = await User.findById(userId);
    if (!user) return (next(new AppError("User not found", 404)))

    const product = await Product.findById(productId);
    if (!product) return (next(new AppError("Product not found", 404)))


    const cartItemIndex = user.cart.findIndex(

      item => {
        return item.product.equals(productId)
      }
    );

    if (cartItemIndex !== -1) {
      user.cart[cartItemIndex].quantity += quantity;
    } else {
      user.cart.push({ product: productId, quantity });
    }

    await user.save();

    res.status(200).json({
      status: 200,
      message: "Product added to cart",
      data: user.cart
    });

  }
)

/**
 * @desc    add single item to cart
 * @route   Put /cart/:productId
 * @access  confrimed user
 */
export const updateSingleItemInCart: RequestHandler = catchAsync(

  async (req, res, next) => {
    const userId = req.user!.userId;
    const { quantity } = req.body;
    const { productId } = req.params;

    if (!quantity || quantity < 1) return next(new AppError("Invalid quantity", 400));
    if (!productId || typeof productId !== 'string') {
      return (next(new AppError('invalid productiD', 400)))
    }

    const user = await User.findById(userId);
    if (!user) return (next(new AppError("User not found", 404)))

    const cartItemIndex = user.cart.findIndex(
      item => item.product.equals(productId)
    );

    if (cartItemIndex === -1) {
      return (next(new AppError('Product not found in cart', 404)))
    }

    user.cart[cartItemIndex].quantity = quantity;
    await user.save();

    res.status(200).json({
      status: 200,
      message: "Cart item updated successfully",
      data: user.cart
    });
  }
)

/**
 * @desc    delete item from cart
 * @route   Delete /cart/:productId
 * @access  confrimed user
 */
export const deleteSingelItemCart: RequestHandler = catchAsync(

  async (req, res, next) => {
     const id = req.user!.userId;
     const { productId } = req.params
     const user = await User.findById(id);
     if (!user) return (next(new AppError('User not found', 404)))

      if(!productId || typeof productId !== 'string'){
        return (next(new AppError('Product ID is invalid or missing', 400)))
      }
 
     const cartItemIndex = user.cart.findIndex(
       item => item.product.equals(productId)
     );
 
     if (cartItemIndex === -1) {
      return (next(new AppError('Product not found in cart', 404)))
     }
 
     user.cart.splice(cartItemIndex, 1);
     await user.save();
 
     res.status(200).json({
       status: 200,
       message: "product deleted successfully",
       data: user.cart
     })
  
 }
)

/**
 * @desc    delete item from cart
 * @route   Delete /cart/:productId
 * @access  confrimed user
 */
export const deleteCart: RequestHandler =catchAsync(
  
  async (req, res, next) => {
      const id = req.user!.userId;
      const user = await User.findById(id);
      if (!user) return (next(new AppError('User not found', 404)))
  
      user.cart = [];
      await user.save();
  
      res.status(200).json({
        status: 200,
        message: "postCart successfully",
        data: user.cart
      })
   
  }
) 

/**
 * @desc    sync user local cart with DB cart
 * @route   Delete /cart/sync
 * @access  confrimed user
 */
export const syncCart: RequestHandler = catchAsync(

  async (req, res, next) => {
      const userId = req.user!.userId;
      const items = req.body.items; // מערך של אובייקטים { product, quantity }
  
      if (!Array.isArray(items) || items.length === 0) {
        return (next(new AppError('Items must be a non-empty array', 400)))
      }
  
      const user = await User.findById(userId);
      if (!user) return (next(new AppError('User not found', 404)))

      const productIds = items.map((i: { product: string }) => i.product);
      const products = await Product.find({ _id: { $in: productIds } }).select('_id').lean();
      const validIds = new Set(products.map((p: { _id: any }) => String(p._id)));

      for (const { product, quantity = 1 } of items) {
        if (!validIds.has(String(product))) {
          return (next(new AppError(`Product not found: ${product}`, 404)))
        }

        const cartItemIndex = user.cart.findIndex(
          item => item.product.equals(product)
        );

        if (cartItemIndex === -1) {
          user.cart.push({ product, quantity });
        } else {
          user.cart[cartItemIndex].quantity += quantity;
        }
      }
  
      await user.save();
  
      res.status(200).json({
        status: 200,
        message: "Products added to cart",
        data: user.cart
      });
  
  }
)
