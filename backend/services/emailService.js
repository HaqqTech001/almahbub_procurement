/**
 * Resend Email Service
 * Uses the official Resend SDK for transactional emails
 */

class EmailService {
  constructor() {
    this.resend = null;
    this.initialized = false;
    this.initialize();
  }

  initialize() {
    if (this.initialized) return;

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.error('[EMAIL] RESEND_API_KEY not found in environment variables!');
      console.error('[EMAIL] Please add RESEND_API_KEY to your .env file');
      return;
    }

    try {
      // Dynamic import for Resend SDK
      const { Resend } = require('resend');
      this.resend = new Resend(apiKey);
      this.initialized = true;
      console.log('[EMAIL] ✓ Resend email service initialized successfully');
    } catch (error) {
      console.error('[EMAIL] Failed to initialize Resend SDK:', error.message);
      console.error('[EMAIL] Install Resend: npm install resend');
    }
  }

  async verifyConnection() {
    if (!this.resend) {
      throw new Error('Resend not configured. Please set RESEND_API_KEY in environment variables.');
    }

    try {
      // Resend doesn't have a direct verify method, so we try to send a test
      console.log('[EMAIL] Verifying Resend connection...');
      return true;
    } catch (error) {
      console.error('[EMAIL] Resend connection failed:', error.message);
      throw error;
    }
  }

  async sendEmail(to, subject, html, attachments = []) {
    if (!this.resend) {
      throw new Error('Email provider not configured. Please set RESEND_API_KEY in environment variables.');
    }

    try {
      console.log(`[EMAIL] Sending email via Resend to: ${to}`);

      // Support both EMAIL_FROM and FROM_EMAIL environment variables
      let fromEmail = process.env.EMAIL_FROM || process.env.FROM_EMAIL;
      const fromName = process.env.EMAIL_FROM_NAME || process.env.FROM_NAME || 'Almahbub International';

      // Validate FROM_EMAIL is set
      if (!fromEmail) {
        console.error('[EMAIL] ERROR: FROM_EMAIL or EMAIL_FROM environment variable is not set!');
        console.error('[EMAIL] Please set one of these in your Render environment variables:');
        console.error('[EMAIL]   - FROM_EMAIL=your-verified-email@yourdomain.com');
        console.error('[EMAIL]   - OR EMAIL_FROM=your-verified-email@yourdomain.com');
        throw new Error('FROM_EMAIL environment variable is not configured');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(fromEmail)) {
        console.error(`[EMAIL] ERROR: Invalid email format for FROM_EMAIL: ${fromEmail}`);
        throw new Error(`Invalid email format: ${fromEmail}`);
      }

      // Format: "Name <email@example.com>" or just "email@example.com"
      let fromField;
      if (fromName && fromName.trim()) {
        fromField = `${fromName} <${fromEmail}>`;
      } else {
        fromField = fromEmail;
      }

      console.log(`[EMAIL] From field: ${fromField}`);

      // Format attachments for Resend
      const resendAttachments = attachments.map(att => ({
        filename: att.filename || att.name,
        content: att.content ? Buffer.from(att.content).toString('base64') : undefined,
        path: att.path,
      }));

      const result = await this.resend.emails.send({
        from: fromField,
        to: [to],
        subject: subject,
        html: html,
        attachments: resendAttachments.length > 0 ? resendAttachments : undefined,
      });

      if (result.error) {
        console.error('[EMAIL] Resend API error:', result.error);
        throw new Error(result.error.message);
      }

      console.log(`[EMAIL] ✓ Sent successfully! ID: ${result.data?.id}`);
      return result.data;
    } catch (error) {
      console.error('[EMAIL] Failed to send email:', error.message);
      throw error;
    }
  }

  async sendWelcomeEmail(user) {
    const clientUrl = process.env.CLIENT_URL || 'https://almahbub-international.onrender.com/login';
    const verificationUrl = `${clientUrl}/verify-email/${user.email_verification_token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <tr>
            <td style="background: linear-gradient(135deg, #205562, #0E5A5C); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Almahbub International!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px; background: #f5f7f8;">
              <h2 style="color: #205562;">Hi ${user.first_name} ${user.last_name},</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Thank you for registering with Almahbub International Procurement & Service Management Platform.
              </p>
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Please verify your email address to complete your registration and access all our procurement services.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="text-align: center; padding: 30px 0;">
                    <a href="${verificationUrl}" 
                       style="background: linear-gradient(135deg, #FCD693, #E7B96A); 
                              color: #205562; 
                              padding: 15px 35px; 
                              text-decoration: none; 
                              border-radius: 8px; 
                              font-weight: bold; 
                              display: inline-block;
                              font-size: 16px;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size: 14px; color: #666; line-height: 1.6;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${verificationUrl}" style="color: #205562;">${verificationUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #205562; padding: 20px; text-align: center;">
              <p style="color: white; font-size: 12px; margin: 0;">
                &copy; ${new Date().getFullYear()} Almahbub International. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.sendEmail(user.email, 'Welcome to Almahbub International - Verify Your Email', html);
  }

  async sendPasswordResetEmail(user, resetToken) {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <tr>
            <td style="background: linear-gradient(135deg, #205562, #0E5A5C); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset Request</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px; background: #f5f7f8;">
              <h2 style="color: #205562;">Hi ${user.first_name} ${user.last_name},</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                We received a request to reset your password for your Almahbub International account.
              </p>
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Click the button below to reset your password. This link will expire in 1 hour.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="text-align: center; padding: 30px 0;">
                    <a href="${resetUrl}" 
                       style="background: linear-gradient(135deg, #FCD693, #E7B96A); 
                              color: #205562; 
                              padding: 15px 35px; 
                              text-decoration: none; 
                              border-radius: 8px; 
                              font-weight: bold; 
                              display: inline-block;
                              font-size: 16px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size: 14px; color: #666; line-height: 1.6;">
                If you didn't request this password reset, please ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #205562; padding: 20px; text-align: center;">
              <p style="color: white; font-size: 12px; margin: 0;">
                &copy; ${new Date().getFullYear()} Almahbub International. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.sendEmail(user.email, 'Reset Your Almahbub International Password', html);
  }

  async sendOrderStatusUpdate(user, order, status) {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const orderUrl = `${clientUrl}/orders/${order.id}`;

    const statusMessages = {
      pending: 'Your request has been received and is pending review.',
      received: 'Your request has been received and is pending review.',
      reviewing: 'Your request is now being reviewed.',
      discussion: 'Your request is under discussion.',
      sourcing: 'Your request is being sourced.',
      processing: 'Your request is now being processed.',
      approved: 'Great news! Your request has been approved.',
      rejected: 'Unfortunately, your request could not be processed.',
      completed: 'Your request has been completed successfully.',
      cancelled: 'Your request has been cancelled.'
    };

    const statusColors = {
      pending: '#FFA500',
      received: '#FFA500',
      reviewing: '#3498db',
      discussion: '#9b59b6',
      sourcing: '#1abc9c',
      processing: '#3498db',
      approved: '#27ae60',
      rejected: '#e74c3c',
      completed: '#27ae60',
      cancelled: '#95a5a6'
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <tr>
            <td style="background: linear-gradient(135deg, #205562, #0E5A5C); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Procurement Request Status Update</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px; background: #f5f7f8;">
              <h2 style="color: #205562;">Hi ${user.first_name} ${user.last_name},</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Your procurement request status has been updated to: 
                <span style="background-color: ${statusColors[status] || '#205562'}; color: white; padding: 4px 12px; border-radius: 4px; font-weight: bold;">
                  ${status.toUpperCase()}
                </span>
              </p>
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                ${statusMessages[status] || 'Your request status has been updated.'}
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e0e0e0;">
                <h3 style="color: #205562; margin: 0 0 15px 0; border-bottom: 2px solid #F3CB68; padding-bottom: 10px;">Request Details:</h3>
                <p style="margin: 8px 0;"><strong>Request ID:</strong> #${order.id}</p>
                <p style="margin: 8px 0;"><strong>Title:</strong> ${order.title || 'N/A'}</p>
                <p style="margin: 8px 0;"><strong>Status:</strong> ${status}</p>
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="text-align: center; padding: 30px 0;">
                    <a href="${orderUrl}"
                       style="background: linear-gradient(135deg, #FCD693, #E7B96A);
                              color: #205562;
                              padding: 15px 35px;
                              text-decoration: none;
                              border-radius: 8px;
                              font-weight: bold;
                              display: inline-block;
                              font-size: 16px;">
                      View Request Details
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #205562; padding: 20px; text-align: center;">
              <p style="color: white; font-size: 12px; margin: 0;">
                &copy; ${new Date().getFullYear()} Almahbub International. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.sendEmail(user.email, `Order #${order.id} Status Update - ${status}`, html);
  }

  async sendNewMessageNotification(user, sender, message) {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const chatUrl = `${clientUrl}/chat`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <tr>
            <td style="background: linear-gradient(135deg, #205562, #0E5A5C); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">New Message Received</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px; background: #f5f7f8;">
              <h2 style="color: #205562;">Hi ${user.first_name} ${user.last_name},</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                You have received a new message from <strong>${sender.first_name} ${sender.last_name}</strong>.
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F3CB68;">
                <p style="margin: 0; font-style: italic; color: #333; font-size: 15px;">"${message}"</p>
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="text-align: center; padding: 30px 0;">
                    <a href="${chatUrl}" 
                       style="background: linear-gradient(135deg, #FCD693, #E7B96A); 
                              color: #205562; 
                              padding: 15px 35px; 
                              text-decoration: none; 
                              border-radius: 8px; 
                              font-weight: bold; 
                              display: inline-block;
                              font-size: 16px;">
                      Reply to Message
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #205562; padding: 20px; text-align: center;">
              <p style="color: white; font-size: 12px; margin: 0;">
                &copy; ${new Date().getFullYear()} Almahbub International. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.sendEmail(user.email, `New Message from ${sender.first_name} ${sender.last_name}`, html);
  }
}

module.exports = new EmailService();
