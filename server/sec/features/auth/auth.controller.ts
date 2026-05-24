import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
import User from "../users/user.model.js";
import dotenv from "dotenv"
import { sendVerificationEmail, sendResetPasswordEmail, sendTwoFactorEmail } from "../../utils/mailer.js";
dotenv.config()
import crypto from "crypto";
import { RequestHandler } from "express";
import { catchAsync } from "../../../shared/middleware/catchAsync.js";
import AppError from "../../../shared/utils/appError.js";




/**
 * @desc    register new user
 * @route   Post auth/register
 * @access  all users
 */

export const register: RequestHandler = catchAsync(

    async (req, res, next) => {

        const { name, email, password } = req.body

        const hashed = await bcrypt.hash(password, 10)

        const rawToken = crypto.randomBytes(32).toString("hex");
        // Store a hash of the token — the raw token travels in the email link only
        const hashedVerificationToken = crypto.createHash("sha256").update(rawToken).digest("hex");
        const verificationTokenExpiry = Date.now() + 1000 * 60 * 60 * 24; // 24 hours

        const user = await User.create({
            name,
            email,
            verificationToken: hashedVerificationToken,
            password: hashed,
            verificationTokenExpiry: verificationTokenExpiry
        })

        const link = `${process.env.STOREFRONT_URL}/verify-email/${rawToken}`;

        // Fire-and-forget — respond immediately so the frontend doesn't time out
        // while waiting for the SMTP handshake. Failures are logged server-side.
        sendVerificationEmail(email, link).catch((err) =>
            console.error(`[mailer] Failed to send verification email to ${email}:`, err)
        );

        // Strip sensitive fields before sending the response
        const { password: _pw, verificationToken, verificationTokenExpiry: _exp, ...safeUser } = user.toObject();

        res.status(201).json({
            status: 201,
            message: "Verification code sent.",
            data: safeUser
        })
    }

)

/**
 * @desc    verify user email
 * @route   Get auth/verify-email/:rawToken
 * @access  registered user
 */
export const verifyEmail: RequestHandler = catchAsync(

    async (req, res, next) => {

        const { rawToken } = req.params;

        // Hash the incoming raw token to compare against the stored hash
        const hashedToken = crypto.createHash("sha256").update(rawToken as string).digest("hex");

        const user = await User.findOne({
            verificationToken: hashedToken,
            verificationTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return next(new AppError('Invalid or expired verification token', 400))
        }

        user.isVerified = true;
        user.verificationToken = null;
        user.verificationTokenExpiry = null;

        await user.save();

        res.status(200).json({ message: "Email verified successfully" });

    }
)

/**
 * @desc    login user
 * @route   Post auth/login
 * @access  confirmed user
 */
export const login: RequestHandler = catchAsync(

    async (req, res, next) => {

        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return next(new AppError('Invalid credentials', 400))

        }

        if (!user.isVerified) {
            return next(new AppError('User is not verified', 400))
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return next(new AppError('Invalid credentials', 400))
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET!,
            { expiresIn: "7d" }
        );

        return res.status(200).json({
            status: 200,
            message: "Login successfully",
            data: token
        });

    }
)

/**
 * @desc    send link for reset password
 * @route   Post auth/password-forgot
 * @access  confirmed user
 */
export const forgotPassword: RequestHandler = catchAsync(

    async (req, res, next) => {
        const { email } = req.body;

        const user = await User.findOne({ email });

        // Always respond with 200 regardless of whether the email exists.
        // Returning an error for unknown emails leaks which addresses are registered.
        if (user) {
            const rawToken = crypto.randomBytes(32).toString("hex");

            const hashedToken = crypto
                .createHash("sha256")
                .update(rawToken)
                .digest("hex");

            user.resetPasswordToken = hashedToken;
            user.resetPasswordExpiry = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes
            await user.save();

            const link = `${process.env.STOREFRONT_URL}/reset-password/${rawToken}`;
            // Fire-and-forget — avoids SMTP timeout blocking the response
            sendResetPasswordEmail(email, link).catch((err) =>
                console.error(`[mailer] Failed to send reset email to ${email}:`, err)
            );
        }

        return res.status(200).json({
            status: 200,
            message: "Reset link sent successfully",
            data: null,
        });

    }
)

/**
 * @desc    reset password
 * @route   Post auth/password-reset/:token
 * @access  confirmed user
 */
export const resetPassword: RequestHandler = catchAsync(

    async (req, res, next) => {
        const { token } = req.params;
        const { password } = req.body;

        if (!password) {
            return next(new AppError("password is requierd", 400))
        }
        if (!token || typeof token !== 'string') {
            return next(new AppError("token formatted badly", 400))
        }

        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpiry: { $gt: Date.now() },
        });

        if (!user) {
            return next(new AppError("Token invalid or expired", 401))
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;

        user.resetPasswordToken = null;
        user.resetPasswordExpiry = null;

        await user.save();

        return res.status(200).json({
            status: 200,
            message: "Password reset successfully",
            data: null,
        });


    }
)

/**
 * @desc    resend verification email
 * @route   Post auth/resend-verification
 * @access  public
 */
export const resendVerification: RequestHandler = catchAsync(

    async (req, res) => {
        const { email } = req.body;

        // Always respond 200 regardless of whether the email exists —
        // revealing a difference would allow email enumeration.
        const user = await User.findOne({ email });

        if (user && !user.isVerified) {
            const rawToken = crypto.randomBytes(32).toString("hex");
            const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
            const expiry = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours (same as register)

            user.verificationToken = hashedToken;
            user.verificationTokenExpiry = expiry;
            await user.save();

            const link = `${process.env.STOREFRONT_URL}/verify-email/${rawToken}`;

            // Fire-and-forget — same pattern as register
            sendVerificationEmail(email, link).catch((err) =>
                console.error(`[mailer] Failed to resend verification email to ${email}:`, err)
            );
        }

        return res.status(200).json({
            status: 200,
            message: "If that address is registered and unverified, a new link has been sent.",
            data: null,
        });
    }
)

/**
 * @desc    admin login
 * @route   Post auth/admin/login
 * @access  Admin
 */
export const adminLogin: RequestHandler = catchAsync(

    async (req, res, next) => {

        const { email, password } = req.body;

        const user = await User.findOne({ email }).select("+password");
        if (!user || user.role !== "admin") {
            return next(new AppError("Invalid admin credentials", 400))

        }

        if (!user.isVerified) {
            return next(new AppError("Admin email not verified", 400))
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return next(new AppError("Invalid admin credentials", 400))
        }

        const twoFactorCode = Math.floor(100000 + Math.random() * 900000).toString();
        const twoFactorExpiry = new Date(Date.now() + 1000 * 60 * 5);

        const hashedCode = crypto.createHash("sha256").update(twoFactorCode).digest("hex");
        user.twoFactorCode = hashedCode;
        user.twoFactorExpiry = twoFactorExpiry;
        await user.save();
        // Fire-and-forget — respond immediately so the frontend doesn't time out
        // while waiting for the SMTP handshake. The code is valid for 5 minutes.
        sendTwoFactorEmail(email, twoFactorCode).catch((err) =>
            console.error(`[mailer] Failed to send 2FA email to ${email}:`, err)
        );

        res.status(200).json({
            status: 200,
            message: "2FA code sent to admin email",
            data: { userId: user._id }
        });


    }
)

/**
 * @desc    verify admin 2FA
 * @route   Post auth/admin/verify-2fa
 * @access  Admin
 */
export const verify2FA: RequestHandler = catchAsync(

    async (req, res, next) => {
        const { userId, code } = req.body;

        if (!userId || !code) {
            return next(new AppError("userId and code are required", 400))
        }

        // Explicitly select the 2FA fields that have select:false on the schema
        const user = await User.findById(userId).select('+twoFactorCode +twoFactorExpiry');

        if (!user) {
            return next(new AppError("Admin not found", 404))
        }

        if (!user.twoFactorCode || !user.twoFactorExpiry || user.twoFactorExpiry.getTime() < Date.now()) {
            return next(new AppError("2FA code expired or invalid", 400))
        }

        const hashedInput = crypto.createHash("sha256").update(code).digest("hex");
        if (user.twoFactorCode !== hashedInput) {
            return next(new AppError("Invalid 2FA code", 400))
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET!,
            { expiresIn: "1h" }
        );

        user.twoFactorCode = null;
        user.twoFactorExpiry = null;
        await user.save();

        res.status(200).json({
            status: 200,
            message: "2FA verified successfully",
            data: { token }
        });

    }
)

/**
 * @desc    logout
 * @route   Post auth/logout
 * @access  public — no authMiddleware so expired tokens can still be invalidated
 */
export const logout: RequestHandler = catchAsync(

    async (req, res, next) => {

        const authHeader = req.headers.authorization;

        if (authHeader?.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            try {
                // ignoreExpiration: verify the signature but don't reject expired tokens —
                // we want to invalidate sessions even when the JWT has already expired.
                const decoded = jwt.verify(token, process.env.JWT_SECRET!, { ignoreExpiration: true });
                if (typeof decoded !== 'string' && decoded.userId) {
                    await User.findByIdAndUpdate(decoded.userId, { tokenInvalidatedAt: new Date() });
                }
            } catch {
                // Malformed token or bad signature — nothing to invalidate, proceed anyway.
            }
        }

        return res.status(200).json({
            status: 200,
            message: "User logged out successfully",
            data: null
        });
    }
)
