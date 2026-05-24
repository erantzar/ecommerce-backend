import { catchAsync } from "../../../shared/middleware/catchAsync.js";
import AppError from "../../../shared/utils/appError.js";
import Product from "../products/products.model.js";
import User from '../users/user.model.js'
import { sendOrderEmail } from "../../utils/mailer.js";
import Order from "./order.model.js";
import { sendOrderStatusEmail } from "../../utils/mailer.js";
import { RequestHandler } from "express";
import { IOrderDocuments, IOrderItemSchema } from "../../types/order.types.js";

/**
 * @desc    Aggregate order stats (total orders, pending count, total revenue)
 * @route   GET /orders/stats
 * @access  Admin
 */
export const getOrderStats: RequestHandler = catchAsync(async (_req, res, _next) => {
  const [stats] = await Order.aggregate([
    {
      // Exclude cancelled orders — they should not contribute to revenue
      $match: { orderStatus: { $ne: 'cancelled' } },
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totalprice' },
        pendingOrders: {
          $sum: { $cond: [{ $eq: ['$orderStatus', 'pending'] }, 1, 0] },
        },
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      totalOrders: stats?.totalOrders ?? 0,
      totalRevenue: stats?.totalRevenue ?? 0,
      pendingOrders: stats?.pendingOrders ?? 0,
    },
  });
});

/**
 * @desc    Create a new Order
 * @route   Get orders/
 * @access  Confrimed User
 */
export const createOrder: RequestHandler = catchAsync(async (req, res, next) => {
  const { items, addressId, paymentMethod, notes, shipingCost } = req.body;
  const userId = req.user!.userId

  //getting the adress object from user
  const user = await User.findById(userId);
  if (!user) return next(new AppError("User not found", 404));

  const address = user.addresses.id(addressId);
  if (!address) return next(new AppError("Address not found", 404));

  const shippingAddress = {
    city: address.city,
    street: address.street,
    houseNumber: address.houseNumber,
    zip: address.zip,
  }

  if (!items || items.length === 0) {
    return next(new AppError('An order must contain at least one item.', 400));
  }



  const resolvedItems: IOrderItemSchema[] = [];
  let totalPrice = 0;

  // Batch-fetch all products in one query instead of one per item
  const productIds = items.map((item: { product: string }) => item.product);
  const products = await Product.find({ _id: { $in: productIds } })
    .select('stock price name images isActive sold');
  const productMap = new Map(products.map(p => [String(p._id), p]));

  for (const orderItem of items) {
    const product = productMap.get(String(orderItem.product));

    if (!product) {
      return next(new AppError(`Product with ID ${orderItem.product} was not found.`, 404));
    }

    if (!product.isActive) {
      return next(new AppError(`product ${product.name} is unactive`, 404));
    }

    totalPrice += orderItem.quantity * product.price;

    // Atomic stock decrement must remain per-product to prevent overselling
    const updated = await Product.findOneAndUpdate(
      { _id: product._id, stock: { $gte: orderItem.quantity }, isActive: true },
      { $inc: { stock: -orderItem.quantity, sold: orderItem.quantity } },
      { returnDocument: 'after' }
    );

    if (!updated) {
      return next(new AppError(`Insufficient stock for "${product.name}"`, 400));
    }

    resolvedItems.push({
      product: String(product._id),
      name: product.name,
      price: product.price,
      image: product.images[0],
      quantity: orderItem.quantity,
    });
  }

  const order: IOrderDocuments = await Order.create({
    user: userId,
    items: resolvedItems,
    shippingAddress,
    paymentMethod,
    notes,
    totalprice: (totalPrice + shipingCost),
  });

  await sendOrderEmail(order, req.user!.email);

  res.status(201).json({
    status: 'success',
    data: order,
  });
});

/**
 * @desc    Get my orders by Id
 * @route   Get /orders/my-orders/:id
 * @access  Confrimed User
 */
export const myOrders: RequestHandler = catchAsync(async (req, res, next) => {
  const id = req.user!.userId;

  const orders = await Order.find({ user: id }).lean();

  res.status(200).json({
    status: 'success',
    results: orders.length,
    data: orders,
  });
});

/**
 * @desc    Get single orders by Id
 * @route   Get /orders/:id
 * @access  Confrimed User/ Admin
 */

export const singelOrderById: RequestHandler = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const userId = req.user!.userId

  const order = await Order.findById(id).lean();

  if (!order) {
    return next(new AppError(`No order found with ID: ${id}`, 404));
  }

  const orderUserId = order.user
  const role = req.user!.role
  if (String(userId) === String(orderUserId) || role === "admin")//only if user is admin or if the order is attached to user
  {
    return res.status(200).json({
      status: 'success',
      data: order,
    });

  } else {
    return next(new AppError(`Unauthorized`, 403));

  }


});

/**
 * @desc    Get all orders
 * @route   Get /orders
 * @access  Admin
 */
export const getAllOrders: RequestHandler = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
  } = req.query


  // ── 3. PAGINATION ───────────────────────────────────────────────
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit))); // max 50 per page
  const skip = (pageNum - 1) * limitNum;

  const [order, totalOrders] = await Promise.all([

    Order.find()
      .sort({ createdAt: -1 })//newst first
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Order.countDocuments()
  ]);

  const totalPages = Math.ceil(totalOrders / limitNum);

  res.status(200).json({
    status: 'success',
    results: order.length,
    pagination: {
      currentPage: pageNum,
      totalPages,
      totalOrders,
      limit: limitNum,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1
    },
    data: order,
  });
});

/**
 * @desc    update status of order by Id
 * @route   Put /orders/:id/status
 * @access  Admin
 */
export const updateStatus: RequestHandler = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { orderStatus } = req.body;

  // Fetch the user email before updating — populate is kept separate so the
  // final response returns user as a plain string ID, matching the Order type.
  const existing = await Order.findById(id)
    .populate<{ user: { email: string } }>({ path: 'user', select: 'email -_id' })
    .lean();

  if (!existing) {
    return next(new AppError(`No orders found with ID: ${id}`, 404));
  }

  if (!existing.user || typeof existing.user === 'string') {
    return next(new AppError('User data could not be populated', 500));
  }

  const userEmail = existing.user.email;

  const order = await Order.findByIdAndUpdate(
    id,
    { orderStatus },
    { returnDocument: 'after', runValidators: true }
  ).lean();

  if (!order) {
    return next(new AppError(`No orders found with ID: ${id}`, 404));
  }

  await sendOrderStatusEmail(userEmail, id as string, orderStatus);

  res.status(200).json({
    status: 'success',
    data: order,
  });
});

/**
 * @desc    cancel own pending order
 * @route   PATCH /orders/:id/cancel
 * @access  Authenticated customer (owns the order)
 */
export const cancelMyOrder: RequestHandler = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  // First confirm the order exists and belongs to this user
  const existing = await Order.findById(id).lean();
  if (!existing) {
    return next(new AppError(`No order found with ID: ${id}`, 404));
  }
  if (String(existing.user) !== String(userId)) {
    return next(new AppError('Unauthorized', 403));
  }
  if (existing.orderStatus !== 'pending') {
    return next(new AppError(
      `Order cannot be cancelled because it is already ${existing.orderStatus}.`,
      400
    ));
  }

  // Restore stock and sold counts for every item atomically
  await Promise.all(
    existing.items.map((item) =>
      Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, sold: -item.quantity },
      })
    )
  );

  const order = await Order.findByIdAndUpdate(
    id,
    { orderStatus: 'cancelled' },
    { returnDocument: 'after', runValidators: true }
  );

  res.status(200).json({
    status: 'success',
    data: order,
  });
});

/**
 * @desc    cancel order
 * @route   Put /orders/:id/cancel
 * @access  Admin
 */
export const cancelOrder: RequestHandler = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Fetch first so we have the items list for stock restoration
  const existing = await Order.findOne({ _id: id, orderStatus: 'pending' }).lean();

  if (!existing) {
    const exists = await Order.exists({ _id: id });
    return next(new AppError(
      exists
        ? `Order ${id} cannot be cancelled because it is no longer pending.`
        : `No order found with ID: ${id}`,
      exists ? 400 : 404
    ));
  }

  // Restore stock and sold counts for every item atomically
  await Promise.all(
    existing.items.map((item) =>
      Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, sold: -item.quantity },
      })
    )
  );

  const order = await Order.findByIdAndUpdate(
    id,
    { orderStatus: 'cancelled' },
    { returnDocument: 'after', runValidators: true }
  );

  res.status(200).json({
    status: 'success',
    data: order,
  });
});


