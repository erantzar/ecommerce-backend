import mongoose from "mongoose";
import {IOrderDocuments, IOrderItemSchema} from '../../types/order.types.js'


const orderItemSchema = new mongoose.Schema<IOrderItemSchema>({
    // 1. The link to the actual product (for inventory/tracking)
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    // 2. The Snapshots (Hardcoded values)
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    image: {
        type: String
    },
    // 3. Order details
    quantity: {
        type: Number,
        required: true,
        min: 1
    }
});


const orederSchema = new mongoose.Schema<IOrderDocuments>({

    user: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: [true, 'Order must belong to a user']
    },

    items: [
        orderItemSchema
    ],

    shippingAddress: {
        city:{
            type: String,
            required: true
        },
        street:{
            type: String,
            required: true
        },
        houseNumber:{
            type: Number,
            required: true
        },
        zip:{
            type: String,
            required: true
        },
    },

    totalprice: {
        type: Number,
        required: true
    },
    shipingCost: {
        type: Number,
        default: 0, 
    },

    paymentMethod: {
        type: String,
        required: true,
        enum: {
            values: ['credit', 'paypal', 'simulated']
        },
    },

    paymentStatus: {
        type: String,
        enum: {
            values: ['paid', 'pending', 'failed'],
            message: 'Payment status is either: paid, pending or failed'
        },
        default: 'pending',

    },
    orderStatus: {
        type: String,
        enum: {
            values: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
            message: 'orderStatus is either: pending, processing, shipped, delivered or cancelled'
        },
        default: 'pending'
    },

    trackingNumber: String,

    notes: String,
}, {
    timestamps: true
})

const Order = mongoose.model<IOrderDocuments>('Order', orederSchema);
export default Order;
