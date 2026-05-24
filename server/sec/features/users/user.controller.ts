import cloudinary from "../../config/cloudinary.js";
import User from "./user.model.js";
import bcrypt from "bcryptjs";
import {Request, Response, NextFunction, RequestHandler} from "express"
import { catchAsync } from '../../../shared/middleware/catchAsync.js';
import AppError from '../../../shared/utils/appError.js';


/**
 * @desc    get user by Id
 * @route   Get /users/profile
 * @access  confirmed user
 */
export const getUserById: RequestHandler = catchAsync(

  async (req, res, next) => {

      const id = req.user!.userId;
      const user = await User.findById(id);
      if (!user) {
        return next(new AppError("User not found", 404));
      }
      res.status(200).json({
        status: 200,
        message: "User fetched successfully",
        data: user
    })

})

/**
 * @desc    get current user with populated cart
 * @route   Get /users/me
 * @access  confirmed user
 */
export const getMe: RequestHandler = catchAsync(

  async (req, res, next) => {

      const { userId } = req.user!;
      const user = await User.findById(userId).populate({
          path: 'cart.product',
          select: 'name price images'
        });
      if (!user) return next(new AppError("User not found", 404));

      res.status(200).json({
          status: 200,
          message: "User fetched successfully",
          data: user
      });
  }
)


/**
 * @desc    update user profile
 * @route   Put /users/profile
 * @access  confirmed user
 */
export const updateUserProfile: RequestHandler = catchAsync(

  async (req, res, next) => {

    const userId = req.user!.userId;
    const user = await User.findById(userId);
    if (!user) return next(new AppError("User not found", 404));

    const { name, email } = req.body;
    if (name) user.name = name;
    if (email) user.email = email;

    if (req.file) {
      // delete old image from Cloudinary if one exists
      if (user.image) {
        const publicId = user.image.split('/').slice(-3).join('/').split('.')[0];
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch {
          // log warning; old image orphaned but don't block the update
          console.warn(`Failed to delete old Cloudinary image: ${publicId}`);
        }
      }

      user.image = req.file.path;
    }

    await user.save({ validateBeforeSave: true });
    res.status(200).json({
      status: 200,
      message: "update User Profile successfully",
      data: user
  })


  }

)


/**
 * @desc    change user password
 * @route   Put /users/change-password
 * @access  confirmed user
 */
export const changePassword: RequestHandler = catchAsync (

  async (req, res, next) => {

      const {userId} = req.user!;
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) return next(new AppError("Missing passwords", 400))

      const user = await User.findById(userId).select("+password");

      if (!user) return next(new AppError("user not found", 404))

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return next(new AppError("old password is incorrect", 401))
      }

      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();

      res.status(200).json({
        status: 200,
        message: "Password updated successfully",
        data: null
      });
  }
)

/**
 * @desc    update user address
 * @route   Put /users/addresses/:addrId
 * @access  confirmed user
 */
export const updateAddress: RequestHandler = catchAsync (

  async (req, res, next) => {

      const userId = req.user!.userId;
      const { addrId } = req.params;
      const { city, street, houseNumber, zip } = req.body;

      const user = await User.findById(userId);
      if (!user) return next(new AppError("user not found", 404))

      const address = user.addresses.id(addrId as string);
      if (!address) return next(new AppError("address not found", 404));

      if (city) address.city = city;
      if (street) address.street = street;
      if (houseNumber) address.houseNumber = houseNumber;
      if (zip) address.zip = zip;

      await user.save({ validateBeforeSave: true });

      res.status(200).json({
        status: 200,
        message: "Address updated successfully",
        data: user,
      });

  }

)

/**
 * @desc    add new user address
 * @route   Post /users/addresses
 * @access  confirmed user
 */
export const addUserAdress: RequestHandler = catchAsync(

  async (req, res, next) => {

      const userId = req.user!.userId;
      const { city, street, houseNumber, zip } = req.body;

      const user = await User.findByIdAndUpdate(
        {_id: userId},
        {
          $push: {
            addresses: { city, street, houseNumber, zip }
          }
        },
        { returnDocument: 'after', runValidators: true }
      );

      if (!user) return next(new AppError("user not found", 404))

      res.status(200).json({
        status: 200,
        message: "Address added successfully",
        data: user,
      });

  }

)

/**
 * @desc    delete user address
 * @route   Delete users/addresses/:addrId
 * @access  confirmed user
 */
export const deleteAddress: RequestHandler = catchAsync(

  async (req, res, next) => {

      const {userId} = req.user!;
      const { addrId } = req.params;
      if (typeof addrId !== 'string') return next(new AppError("Invalid Address ID format", 400));

      const user = await User.findById(userId);
      if (!user) return next(new AppError("user not found", 404))

      const addressExists = user.addresses.id(addrId);
      if (!addressExists) {
        return next(new AppError("Address not found", 404));
      }

      user.addresses.pull(addrId);

      await user.save();

      return res.status(200).json({
        status: 200,
        message: "Address deleted successfully",
        data: user.addresses,
      });
  }

)

// ============================
// Admin routes
// ============================

/**
 * @desc    get all users
 * @route   Get users/
 * @access  Admin
 */
export const getAllUsers: RequestHandler = catchAsync(

  async (req, res, _next) => {
    const {
      page   = 1,
      limit  = 100,           // safe default — callers that need all users should paginate
      fields,                 // e.g. ?fields=_id,createdAt,isVerified
    } = req.query;

    const pageNum  = Math.max(1, Number(page));
    const limitNum = Math.min(500, Math.max(1, Number(limit)));
    const skip     = (pageNum - 1) * limitNum;

    // Build a Mongoose field-selection string from the ?fields query param.
    // Only allow simple alphanumeric field names to prevent injection.
    const selectStr = typeof fields === 'string'
      ? fields.split(',').filter((f) => /^-?[\w]+$/.test(f.trim())).join(' ')
      : '';

    const [users, totalUsers] = await Promise.all([
      User.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select(selectStr || '-password -__v')   // always strip password unless caller explicitly requests specific fields
        .lean(),
      User.countDocuments(),
    ]);

    return res.status(200).json({
      status: 200,
      message: 'Users fetched successfully',
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalUsers / limitNum),
        totalUsers,
        limit: limitNum,
      },
      data: users,
    });
  }
)

/**
 * @desc    update user role [ADMIN/CUSTOMER]
 * @route   Put users/role/:id
 * @access  Admin
 */
export const updateUserRole: RequestHandler = catchAsync(

  async (req, res, next) => {

      const { id } = req.params;
      const { role } = req.body;

      if (!['admin', 'customer'].includes(role)) {
        return next(new AppError('Role must be "admin" or "customer"', 400));
      }

      const user = await User.findById(id);
      if (!user) return next(new AppError("user not found", 404))

      user.role = role;
      await user.save();

      return res.status(200).json({
        status: 200,
        message: "Role updated successfully",
        data: user,
      });
  }

)

/**
 * @desc    delete user by id
 * @route   Delete users/:id
 * @access  Admin
 */
export const deleteUser: RequestHandler = catchAsync(

  async (req, res, next) => {

      const { id } = req.params;

      const user = await User.findById(id);
      if (!user) return next(new AppError("user not found", 404))

      await user.deleteOne();

      return res.status(200).json({
        status: 200,
        message: "User deleted successfully",
        data: null,
      })
  }

)
