import { Resend } from 'resend';
import {
  sendVerificationEmailHTML,
  sendResetPasswordEmailHTML,
  sendTwoFactorEmailHTML,
  sendOrderEmailHTML,
  sendOrderStatusEmailHTML
} from "./mailer.messeges.js";
import { IOrderDocuments, statusConfigLocation } from "../types/order.types.js";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'Ecommerce <onboarding@resend.dev>';

async function sendVerificationEmail(to: string, verificationLink: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Welcome! Please verify your email",
    html: sendVerificationEmailHTML(verificationLink),
  });
}

async function sendResetPasswordEmail(to: string, resetLink: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Reset Your Password",
    html: sendResetPasswordEmailHTML(resetLink),
  });
}

async function sendTwoFactorEmail(to: string, twoFactorCode: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Admin Login - Two Factor Authentication Code",
    html: sendTwoFactorEmailHTML(twoFactorCode),
  });
}

async function sendOrderEmail(order: IOrderDocuments, to: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Order Confirmation #${order._id}`,
    html: sendOrderEmailHTML(order),
  });
}

async function sendOrderStatusEmail(to: string, orderId: string, orderStatus: statusConfigLocation) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Order Update - #${orderId}`,
    html: sendOrderStatusEmailHTML(orderId, orderStatus),
  });
}

export { sendVerificationEmail, sendResetPasswordEmail, sendTwoFactorEmail, sendOrderEmail, sendOrderStatusEmail };
