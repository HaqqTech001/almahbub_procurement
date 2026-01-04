const nodemailer = require('nodemailer');

const GMAIL_USER='almahbubinternational@gmail.com'
const GMAIL_PASS='fqckhnvioenqmmio'

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    const gmailUser = GMAIL_USER;
    const gmailPass = GMAIL_PASS;

    if (!gmailUser || !gmailPass) {
      console.error('Email service not configured: GMAIL_USER or GMAIL_PASS environment variables are missing');
      return;
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass
      }
    });

    console.log('Email transporter initialized for:', gmailUser);
  }

  async verifyConnection() {
    if (!this.transporter) {
      throw new Error('Email transporter not initialized. Check environment variables.');
    }

    try {
      await this.transporter.verify();
      console.log('Email server connection verified');
      return true;
    } catch (error) {
      console.error('Email server connection failed:', error.message);
      throw error;
    }
  }

  async sendEmail(to, subject, html, attachments = []) {
    if (!this.transporter) {
      const error = new Error('Email service not configured');
      console.error('Email sending failed:', error.message);
      throw error;
    }

    try {
      const mailOptions = {
        from: {
          name: 'Almahbub International',
          address: process.env.GMAIL_USER
        },
        to,
        subject,
        html,
        attachments
      };

      console.log(`Attempting to send email to: ${to}`);
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error('Email sending failed:', error.message);
      console.error('Error code:', error.code);
      console.error('Response:', error.response);
      throw error;
    }
  }

  async sendWelcomeEmail(user) {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${user.email_verification_token}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #205562, #0E5A5C); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Almahbub International!</h1>
        </div>
        <div style="padding: 40px; background: #f5f7f8;">
          <h2 style="color: #205562;">Hi ${user.first_name} ${user.last_name},</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Thank you for registering with Almahbub International Procurement & Service Management Platform.
          </p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Please verify your email address to complete your registration and access all our procurement services.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: linear-gradient(135deg, #FCD693, #E7B96A); 
                      color: #205562; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: bold; 
                      display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="font-size: 14px; color: #666;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <span style="color: #205562;">${verificationUrl}</span>
          </p>
        </div>
      </div>
    `;

    return this.sendEmail(user.email, 'Welcome to Almahbub International - Verify Your Email', html);
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #205562, #0E5A5C); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset Request</h1>
        </div>
        <div style="padding: 40px; background: #f5f7f8;">
          <h2 style="color: #205562;">Hi ${user.first_name} ${user.last_name},</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            We received a request to reset your password for your Almahbub International account.
          </p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Click the button below to reset your password. This link will expire in 1 hour.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: linear-gradient(135deg, #FCD693, #E7B96A); 
                      color: #205562; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: bold; 
                      display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="font-size: 14px; color: #666;">
            If you didn't request this password reset, please ignore this email.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail(user.email, 'Reset Your Almahbub International Password', html);
  }

  async sendOrderStatusUpdate(user, order, status) {
    const orderUrl = `${process.env.CLIENT_URL}/orders/${order.id}`;

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

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #205562, #0E5A5C); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Procurement Request Status Update</h1>
        </div>
        <div style="padding: 40px; background: #f5f7f8;">
          <h2 style="color: #205562;">Hi ${user.first_name} ${user.last_name},</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Your procurement request status has been updated to: <strong>${status.toUpperCase()}</strong>
          </p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            ${statusMessages[status] || 'Your request status has been updated.'}
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #205562; margin: 0 0 10px 0;">Request Details:</h3>
            <p style="margin: 5px 0;"><strong>Request ID:</strong> #${order.id}</p>
            <p style="margin: 5px 0;"><strong>Title:</strong> ${order.title || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> ${status}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${orderUrl}"
               style="background: linear-gradient(135deg, #FCD693, #E7B96A);
                      color: #205562;
                      padding: 15px 30px;
                      text-decoration: none;
                      border-radius: 8px;
                      font-weight: bold;
                      display: inline-block;">
              View Request Details
            </a>
          </div>
        </div>
      </div>
    `;

    return this.sendEmail(user.email, `Order #${order.id} Status Update - ${status}`, html);
  }

  async sendNewMessageNotification(user, sender, message) {
    const chatUrl = `${process.env.CLIENT_URL}/chat`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #205562, #0E5A5C); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">New Message Received</h1>
        </div>
        <div style="padding: 40px; background: #f5f7f8;">
          <h2 style="color: #205562;">Hi ${user.first_name} ${user.last_name},</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            You have received a new message from <strong>${sender.first_name} ${sender.last_name}</strong>.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F3CB68;">
            <p style="margin: 0; font-style: italic; color: #333;">"${message}"</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${chatUrl}" 
               style="background: linear-gradient(135deg, #FCD693, #E7B96A); 
                      color: #205562; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: bold; 
                      display: inline-block;">
              Reply to Message
            </a>
          </div>
        </div>
      </div>
    `;

    return this.sendEmail(user.email, `New Message from ${sender.first_name} ${sender.last_name}`, html);
  }
}

module.exports = new EmailService();