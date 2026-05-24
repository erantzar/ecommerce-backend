import Joi from "joi";

export const updateUserProfileinSchema = Joi.object({
  email: Joi.string().email().optional(),
  name: Joi.string().min(2).optional()
}).min(1);

export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().min(8).required(),
  newPassword: Joi.string()
    .min(8)
    .max(12)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])'))
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
      'string.min': 'Password must be at least 8 characters long.',
      'string.max': 'Password cannot exceed 12 characters.',
      'any.required': 'Password is a required field.'
    })
});

export const idValidation = Joi.object({
  id: Joi.string().length(24).hex().required()
});

export const updateRoleSchema = Joi.object({
  role: Joi.string().valid('admin', 'customer').required()
});

export const addAddressSchema = Joi.object({
  city: Joi.string().required(),
  street: Joi.string().required(),
  houseNumber: Joi.number().required(),
  zip: Joi.string().required(),
});

export const updateAddressSchema = Joi.object({
  city: Joi.string().optional(),
  street: Joi.string().optional(),
  houseNumber: Joi.number().optional(),
  zip: Joi.string().optional(),
}).min(1);
