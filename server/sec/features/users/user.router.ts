import express, {Router} from "express";
import { authMiddleware, checkRole } from "../auth/auth.middleware.js";
import * as userController from "./user.controller.js";
import { validate } from '../../utils/validate.js'
import {
  changePasswordSchema,
  idValidation,
  updateUserProfileinSchema,
  updateRoleSchema,
  addAddressSchema,
  updateAddressSchema
} from './user.schemas.js'
import { uploadUserAvatar } from "../../config/cloudinary.js";

const router: Router = express.Router();

/* =======================
   USER (authenticated)
======================= */

// Get profile (simple)
router.get("/profile", authMiddleware, userController.getUserById);

// Get profile with populated cart
router.get("/me", authMiddleware, userController.getMe);

// Update profile
router.put("/profile", authMiddleware, validate(updateUserProfileinSchema), uploadUserAvatar.single('image'), userController.updateUserProfile);

// Change password
router.put("/change-password", authMiddleware, validate(changePasswordSchema), userController.changePassword);

// Add address
router.post("/addresses", authMiddleware, validate(addAddressSchema), userController.addUserAdress);

// Update address
router.put("/addresses/:addrId", authMiddleware, validate(updateAddressSchema), userController.updateAddress);

// Delete address
router.delete("/addresses/:addrId", authMiddleware, userController.deleteAddress);


/* =======================
   ADMIN only
======================= */

// Get all users
router.get("/", authMiddleware, checkRole, userController.getAllUsers);

// Change role
router.put("/role/:id", authMiddleware, checkRole, validate(updateRoleSchema), userController.updateUserRole);

// Delete user
router.delete("/:id", authMiddleware, validate(idValidation, 'params'), checkRole, userController.deleteUser);


export default router;
