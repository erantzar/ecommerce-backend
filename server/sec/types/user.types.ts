import { Document, Types } from 'mongoose'




// ─── Address ───────────────────────────────────────────────
export interface IAddress {
  _id: Types.ObjectId
  city:        string
  street:      string
  houseNumber: number
  zip:         string
}

// ─── Cart Item ─────────────────────────────────────────────
export interface ICartItem {
  product:  Types.ObjectId
  quantity: number
}

// ─── User Role ─────────────────────────────────────────────
export type UserRole = 'customer' | 'admin'

// ─── Base User (plain object, no Mongoose) ─────────────────
export interface IUser {
  name:      string
  email:     string
  password:  string
  image?:    string
  role:      UserRole
  isVerified: boolean

  verificationToken?:   string | null
  verificationTokenExpiry?: Date | null

  resetPasswordToken?:  string | null
  resetPasswordExpiry?: Date | null

  twoFactorCode?:   string | null
  twoFactorExpiry?: Date | null

  tokenInvalidatedAt?: Date | null

  addresses: IAddress[]
  cart:      ICartItem[]

  createdAt: Date
  updatedAt: Date
}

// ─── User Document (Mongoose) ──────────────────────────────
export interface IUserDocument extends IUser, Document {

  addresses: Types.DocumentArray<IAddress>
}

// ─── User Response (safe to send to client) ────────────────
export interface IUserResponse {
  _id:       string
  name:      string
  email:     string
  image?:    string
  role:      UserRole
  isVerified: boolean
  addresses: IAddress[]
  cart:      ICartItem[]
  createdAt: Date
  updatedAt: Date
}

// ─── Auth types ────────────────────────────────────────────
export interface IRegisterInput {
  name:     string
  email:    string
  password: string
}

export interface ILoginInput {
  email:    string
  password: string
}

export interface ITokenPayload {
  userId: string
  email:  string
  role:   UserRole
}
// -- 
