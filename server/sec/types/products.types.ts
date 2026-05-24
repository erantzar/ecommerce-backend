import { Document } from "mongoose"
import { IUser } from "./user.types.js"

export interface IRating {
    _id?:       string
    user:       IUser | string
    rating:     number
    comment:    string
    createdAt?:  Date

  }

export type productCategory = 'electronics' | 'clothing' | 'food' | 'home' | 'beauty'
export interface IProduct {
    name:        string
    description: string
    price:        number
    category:    productCategory
    images:     string[]
    stock:       number
    sold?:        number
    isActive?:    boolean
    ratings:    IRating[]
    averageRating?: number
    createdAt: Date
    updatedAt: Date
  }

  
  export interface IProductDocument extends IProduct, Document {

  }