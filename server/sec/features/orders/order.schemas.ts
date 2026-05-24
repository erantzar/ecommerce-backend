import Joi from 'joi';


const objectId = Joi.string()
    .pattern(/^[a-f\d]{24}$/i)
    .message('must be a valid MongoDB ObjectId');

// ─── createOrderSchema ───────────────────────────────────────
export const createOrderSchema = Joi.object({

    items: Joi.array()
        .items(
            Joi.object({
                product: objectId.required(),
                quantity: Joi.number().integer().min(1).required(),
            })
        )
        .min(1)
        .required()
        .messages({
            'array.min': 'An order must contain at least one item.',
        }),

    addressId: objectId.required(),

    paymentMethod: Joi.string()
        .valid('credit', 'paypal', 'simulated')
        .required(),

    shipingCost: Joi.number().min(0).optional(),
    notes: Joi.string().trim().optional(),
});

// ─── updateOrderStatusSchema ─────────────────────────────────
export const updateOrderStatusSchema = Joi.object({
    orderStatus: Joi.string()
        .valid('pending', 'processing', 'shipped', 'delivered', 'cancelled')
        .required()
        .messages({
            'any.only': 'orderStatus must be one of: pending, processing, shipped, delivered, cancelled.',
            'any.required': 'orderStatus is required.',
        }),
});