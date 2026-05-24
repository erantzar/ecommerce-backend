import mongoose from "mongoose";
import { Model } from "mongoose";
import bcrypt from "bcryptjs";
import { IAddress, IUser, IUserDocument } from "../../types/user.types.js";


const adressSchema = new mongoose.Schema<IAddress>({
  city: {
    type: String,
    required: true
  },
  street: {
    type: String,
    required: true
  },
  houseNumber: {
    type: Number,
    required: true
  },
  zip: {
    type: String,
    required: true
  }
});


const userSchema = new mongoose.Schema<IUserDocument>({

  // שם מלא
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2
  },

  // אימייל ייחודי
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  // סיסמה מוצפנת
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false
    //select: true
  },

  image: {
    type: String
  },


  // הרשאות
  role: {
    type: String,
    enum: ["customer", "admin"],
    default: "customer"
  },

  // אימות אימייל
  isVerified: {
    type: Boolean,
    default: false
  },

  verificationToken: { type: String, select: false },
  verificationTokenExpiry: { type: Date, select: false },

  // איפוס סיסמה
  resetPasswordToken: { type: String, select: false },
  resetPasswordExpiry: { type: Date, select: false },

  // 2FA
  twoFactorCode: { type: String, select: false },
  twoFactorExpiry: { type: Date, select: false },

  tokenInvalidatedAt: { type: Date, default: null, select: false },

  // כתובות (פשוט כ-array של אובייקטים)
  addresses: {
    type: [adressSchema],
    default: []
  },

  // עגלת קניות
  cart: {
    type: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },
        quantity: {
          type: Number,
          min: 1,
          required: true
        }
      }
    ],
    default: []
  }

}, { timestamps: true });

/* הצפנת סיסמה לפני שמירה */
// ב-user.model.js
// userSchema.pre("save", async function (next) { // הוספתי next
//   if (!this.isModified("password")) return next();
//   this.password = await bcrypt.hash(this.password, 10);
//   next();
// });

const User: Model<IUserDocument> = mongoose.model("User", userSchema);

export default User;