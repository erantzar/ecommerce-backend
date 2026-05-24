import { IOrder, IOrderDocuments, statusConfigLocation } from "../types/order.types.js"

export const sendVerificationEmailHTML =  (verificationLink: string) => 
    {
return `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .header {
              background-color: #197018;
              padding: 40px 20px;
              text-align: center;
            }
            .header h1 {
              color: #ffffff;
              font-size: 28px;
              margin-bottom: 8px;
            }
            .header p {
              color: #c7d2fe;
              font-size: 15px;
            }
            .body {
              padding: 40px 32px;
              text-align: center;
            }
            .body h2 {
              color: #1f2937;
              font-size: 22px;
              margin-bottom: 12px;
            }
            .body p {
              color: #6b7280;
              font-size: 15px;
              line-height: 1.6;
              margin-bottom: 32px;
            }
            .btn {
              display: inline-block;
              background-color: #197018;
              color: #ffffff !important;
              text-decoration: none;
              padding: 14px 36px;
              border-radius: 8px;
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 32px;
            }
            .link-fallback {
              color: #6b7280;
              font-size: 13px;
              margin-bottom: 8px;
            }
            .link-fallback a {
              color: #4F46E5;
              word-break: break-all;
            }
            .footer {
              background-color: #f9fafb;
              border-top: 1px solid #e5e7eb;
              padding: 24px;
              text-align: center;
            }
            .footer p {
              color: #9ca3af;
              font-size: 13px;
              line-height: 1.6;
            }
          </style>
        </head>
        <body>
          <div class="container">

            <!-- Header -->
            <div class="header">
              <h1>Welcome to Ecommerce</h1>
  
            </div>

            <!-- Body -->
            <div class="body">
              <h2>Verify your email address</h2>
              <p>
                Thanks for signing up! Please verify your email address
                to activate your account and get started.
                This link will expire in <strong>24 hours</strong>.
              </p>

              <!-- CTA Button -->
              <a href="${verificationLink}" class="btn">
                Verify My Email
              </a>

              <!-- Fallback link -->
              <p class="link-fallback">
                If the button doesn't work, copy and paste this link:<br />
                <a href="${verificationLink}">${verificationLink}</a>
              </p>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p>If you didn't create an account, you can safely ignore this email.</p>
              <p style="margin-top: 8px;">© ${new Date().getFullYear()} Ecommerce. All rights reserved.</p>
            </div>

          </div>
        </body>
      </html>
    `}
    
export const sendResetPasswordEmailHTML = (resetLink: string) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .header {
              background-color: #DC2626;
              padding: 40px 20px;
              text-align: center;
            }
            .header h1 {
              color: #ffffff;
              font-size: 28px;
              margin-bottom: 8px;
            }
            .header p {
              color: #fecaca;
              font-size: 15px;
            }
            .body {
              padding: 40px 32px;
              text-align: center;
            }
            .body h2 {
              color: #1f2937;
              font-size: 22px;
              margin-bottom: 12px;
            }
            .body p {
              color: #6b7280;
              font-size: 15px;
              line-height: 1.6;
              margin-bottom: 32px;
            }
            .btn {
              display: inline-block;
              background-color: #DC2626;
              color: #ffffff !important;
              text-decoration: none;
              padding: 14px 36px;
              border-radius: 8px;
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 32px;
            }
            .warning {
              background-color: #fef9c3;
              border: 1px solid #fde047;
              border-radius: 8px;
              padding: 14px 20px;
              margin-bottom: 32px;
            }
            .warning p {
              color: #854d0e;
              font-size: 13px;
              margin: 0;
            }
            .link-fallback {
              color: #6b7280;
              font-size: 13px;
              margin-bottom: 8px;
            }
            .link-fallback a {
              color: #DC2626;
              word-break: break-all;
            }
            .footer {
              background-color: #f9fafb;
              border-top: 1px solid #e5e7eb;
              padding: 24px;
              text-align: center;
            }
            .footer p {
              color: #9ca3af;
              font-size: 13px;
              line-height: 1.6;
            }
          </style>
        </head>
        <body>
          <div class="container">

            <!-- Header -->
            <div class="header">
              <h1>Password Reset</h1>
              <p>We received a request to reset your password</p>
            </div>

            <!-- Body -->
            <div class="body">
              <h2>Reset your password</h2>
              <p>
                Click the button below to reset your password.
                This link will expire in <strong>1 hour</strong>.
              </p>

              <!-- CTA Button -->
              <a href="${resetLink}" class="btn">
                Reset My Password
              </a>

              <!-- Warning box -->
              <div class="warning">
                <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
              </div>

              <!-- Fallback link -->
              <p class="link-fallback">
                If the button doesn't work, copy and paste this link:<br />
                <a href="${resetLink}">${resetLink}</a>
              </p>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p>For security, this link expires in 1 hour and can only be used once.</p>
              <p style="margin-top: 8px;">© ${new Date().getFullYear()} Ecommerce. All rights reserved.</p>
            </div>

          </div>
        </body>
      </html>
    `
}

export const sendTwoFactorEmailHTML = (twoFactorCode: string) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .header {
              background-color: #1f2937;
              padding: 40px 20px;
              text-align: center;
            }
            .header h1 {
              color: #ffffff;
              font-size: 28px;
              margin-bottom: 8px;
            }
            .header p {
              color: #9ca3af;
              font-size: 15px;
            }
            .body {
              padding: 40px 32px;
              text-align: center;
            }
            .body h2 {
              color: #1f2937;
              font-size: 22px;
              margin-bottom: 12px;
            }
            .body p {
              color: #6b7280;
              font-size: 15px;
              line-height: 1.6;
              margin-bottom: 32px;
            }
            .code-container {
              background-color: #f9fafb;
              border: 2px dashed #1f2937;
              border-radius: 12px;
              padding: 24px;
              margin-bottom: 32px;
            }
            .code-container p {
              color: #6b7280;
              font-size: 13px;
              margin-bottom: 12px;
            }
            .code {
              font-size: 48px;
              font-weight: bold;
              letter-spacing: 12px;
              color: #1f2937;
            }
            .warning {
              background-color: #fef9c3;
              border: 1px solid #fde047;
              border-radius: 8px;
              padding: 14px 20px;
              margin-bottom: 32px;
            }
            .warning p {
              color: #854d0e;
              font-size: 13px;
              margin: 0;
            }
            .info-box {
              background-color: #eff6ff;
              border: 1px solid #bfdbfe;
              border-radius: 8px;
              padding: 14px 20px;
              margin-bottom: 32px;
            }
            .info-box p {
              color: #1e40af;
              font-size: 13px;
              margin: 0;
            }
            .footer {
              background-color: #f9fafb;
              border-top: 1px solid #e5e7eb;
              padding: 24px;
              text-align: center;
            }
            .footer p {
              color: #9ca3af;
              font-size: 13px;
              line-height: 1.6;
            }
          </style>
        </head>
        <body>
          <div class="container">

            <!-- Header -->
            <div class="header">
              <h1>Admin Login</h1>
              <p>Two Factor Authentication Required</p>
            </div>

            <!-- Body -->
            <div class="body">
              <h2>Your verification code</h2>
              <p>
                An admin login attempt was detected.
                Use the code below to complete your login.
                This code will expire in <strong>10 minutes</strong>.
              </p>

              <!-- Code Box -->
              <div class="code-container">
                <p>Your one-time code is:</p>
                <div class="code">${twoFactorCode}</div>
              </div>

              <!-- Info box -->
              <div class="info-box">
                <p>This code expires in <strong>10 minutes</strong> and can only be used once.</p>
              </div>

              <!-- Warning box -->
              <div class="warning">
                <p>If you didn't attempt to log in, your account may be compromised. Please change your password immediately.</p>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p>This is an automated security email. Please do not reply.</p>
              <p style="margin-top: 8px;">© ${new Date().getFullYear()} My App. All rights reserved.</p>
            </div>

          </div>
        </body>
      </html>
    `
}

export const sendOrderEmailHTML = (order: IOrderDocuments) => {
//יצירת רשימת המוצרים ב-HTML
const itemsHtml = order.items.map(item => `
    <div style="border-bottom: 1px solid #eee; padding: 10px 0; display: flex; align-items: center;">
      <img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 15px; border-radius: 4px;">
      <div style="flex-grow: 1;">
        <h4 style="margin: 0;">${item.name}</h4>
        <p style="margin: 0; color: #666;">Quantity: ${item.quantity} | Price: $${item.price}</p>
      </div>
      <div style="font-weight: bold;">$${(item.price * item.quantity).toFixed(2)}</div>
    </div>
  `).join('');

  //תוכן האימייל המלא
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
      <h2 style="color: #333; text-align: center;">Order Confirmation</h2>
      <p>Hi there,</p>
      <p>Thank you for your order! Here are your order details:</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>Status:</strong> ${order.orderStatus}</p>
        <p><strong>Payment:</strong> ${order.paymentMethod} (${order.paymentStatus})</p>
      </div>

      <h3>Items:</h3>
      ${itemsHtml}

      <div style="margin-top: 20px; border-top: 2px solid #333; padding-top: 10px;">
        <p><strong>Shipping Cost:</strong> $${order.shipingCost.toFixed(2)}</p>
        <p style="font-size: 1.2em;"><strong>Total Price:</strong> $${order.totalprice.toFixed(2)}</p>
      </div>

      <div style="margin-top: 20px; font-size: 0.9em; color: #555;">
        <h3>Shipping Address:</h3>
        <p>${order.shippingAddress.street} ${order.shippingAddress.houseNumber}, ${order.shippingAddress.city}, ${order.shippingAddress.zip}</p>
      </div>

      <p style="text-align: center; margin-top: 30px; color: #999; font-size: 0.8em;">
        If you have any questions, please contact our support.
      </p>
    </div>
  `;

    return htmlContent
}


export const sendOrderStatusEmailHTML = (orderId: string, orderStatus: statusConfigLocation) => {
    
    const statusConfig = {
        pending: {
          emoji: "🕐",
          color: "#D97706",
          lightColor: "#fef9c3",
          borderColor: "#fde047",
          textColor: "#854d0e",
          title: "Order Received",
          message: "We have received your order and it is currently being processed.",
        },
        processing: {
          emoji: "⚙️",
          color: "#2563EB",
          lightColor: "#eff6ff",
          borderColor: "#bfdbfe",
          textColor: "#1e40af",
          title: "Order is Being Processed",
          message: "Great news! Your order is currently being prepared and processed.",
        },
        shipped: {
          emoji: "🚚",
          color: "#7C3AED",
          lightColor: "#f5f3ff",
          borderColor: "#ddd6fe",
          textColor: "#5b21b6",
          title: "Order Shipped",
          message: "Your order is on its way! It has been shipped and is heading to you.",
        },
        delivered: {
          emoji: "✅",
          color: "#16A34A",
          lightColor: "#f0fdf4",
          borderColor: "#bbf7d0",
          textColor: "#166534",
          title: "Order Delivered",
          message: "Your order has been delivered! We hope you enjoy your purchase.",
        },
        cancelled: {
          emoji: "❌",
          color: "#DC2626",
          lightColor: "#fef2f2",
          borderColor: "#fecaca",
          textColor: "#991b1b",
          title: "Order Cancelled",
          message: "Your order has been cancelled. If you have any questions, please contact us.",
        },
      };
    
      const config = statusConfig[orderStatus] || {
        emoji: "📦",
        color: "#1f2937",
        lightColor: "#f9fafb",
        borderColor: "#e5e7eb",
        textColor: "#374151",
        title: "Order Update",
        message: `Your order status has been updated to: ${orderStatus}`,
      };
      
      return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .header {
              background-color: ${config.color};
              padding: 40px 20px;
              text-align: center;
            }
            .header h1 {
              color: #ffffff;
              font-size: 28px;
              margin-bottom: 8px;
            }
            .header p {
              color: rgba(255,255,255,0.75);
              font-size: 15px;
            }
            .body {
              padding: 40px 32px;
              text-align: center;
            }
            .body h2 {
              color: #1f2937;
              font-size: 22px;
              margin-bottom: 12px;
            }
            .body p {
              color: #6b7280;
              font-size: 15px;
              line-height: 1.6;
              margin-bottom: 32px;
            }
            .order-box {
              background-color: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              padding: 24px;
              margin-bottom: 32px;
            }
            .order-box p {
              color: #6b7280;
              font-size: 13px;
              margin-bottom: 8px;
            }
            .order-id {
              font-size: 20px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 16px !important;
            }
            .status-badge {
              display: inline-block;
              background-color: ${config.lightColor};
              border: 1px solid ${config.borderColor};
              color: ${config.textColor};
              padding: 8px 20px;
              border-radius: 999px;
              font-size: 14px;
              font-weight: bold;
            }
            .info-box {
              background-color: ${config.lightColor};
              border: 1px solid ${config.borderColor};
              border-radius: 8px;
              padding: 14px 20px;
              margin-bottom: 32px;
            }
            .info-box p {
              color: ${config.textColor};
              font-size: 13px;
              margin: 0;
            }
            .footer {
              background-color: #f9fafb;
              border-top: 1px solid #e5e7eb;
              padding: 24px;
              text-align: center;
            }
            .footer p {
              color: #9ca3af;
              font-size: 13px;
              line-height: 1.6;
            }
          </style>
        </head>
        <body>
          <div class="container">

            <!-- Header -->
            <div class="header">
              <h1>${config.emoji} ${config.title}</h1>
              <p>Your order status has been updated</p>
            </div>

            <!-- Body -->
            <div class="body">
              <h2>Order Status Update</h2>
              <p>${config.message}</p>

              <!-- Order Box -->
              <div class="order-box">
                <p>Order ID</p>
                <p class="order-id">#${orderId}</p>
                <p>Current Status</p>
                <span class="status-badge">${config.emoji} ${orderStatus}</span>
              </div>

              <!-- Info box -->
              <div class="info-box">
                <p>📩 You will receive another email if your order status changes again.</p>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p>If you have any questions about your order, please contact our support team.</p>
              <p style="margin-top: 8px;">© ${new Date().getFullYear()} My App. All rights reserved.</p>
            </div>

          </div>
        </body>
      </html>
    `
}

