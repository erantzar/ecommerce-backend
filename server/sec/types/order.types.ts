import { Document } from "mongoose";
import { IProduct } from "./products.types.js";
import { IUser } from "./user.types.js";

export interface IOrderItemSchema{
    product: IProduct | string
    name: string
    price: number
    image: string
    quantity: number
}

export type statusConfigLocation = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export interface IOrder{
    user: IUser | string
    items: [IOrderItemSchema] 
    shippingAddress: {
        city: string,
        street: string,
        houseNumber: number,
        zip: string
    }
    totalprice: number
    shipingCost: number
    paymentMethod: 'credit' | 'paypal' | 'simulated';
    paymentStatus: 'paid' | 'pending' | 'failed';
    orderStatus: statusConfigLocation;
    trackingNumber: string
    notes: string


}

export interface IOrderDocuments extends IOrder, Document {

}