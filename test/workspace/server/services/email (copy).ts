import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import crypto from 'crypto';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private fromAddress: string = '';
  private fromName: string = 'Lumirra Wallet';

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const {
      EMAIL_HOST,
      EMAIL_PORT,
      EMAIL_USER,
      EMAIL_PASSWORD,
      EMAIL_FROM,
    } = process.env;

    if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASSWORD) {
      console.warn('Email configuration incomplete. Email service disabled.');
      console.warn('Required: EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD');
      return;
    }

    this.fromAddress = EMAIL_FROM || EMAIL_USER;
    const port = parseInt(EMAIL_PORT, 10);

    try {
      const transportConfig: any = {
        host: EMAIL_HOST,
        port: port,
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASSWORD,
        },
      };

      if (port === 465) {
        transportConfig.secure = true;
      } else if (port === 587 || port === 2525) {
        transportConfig.secure = false;
        transportConfig.requireTLS = true;
        transportConfig.tls = {
          minVersion: 'TLSv1.2',
        };
      } else {
        transportConfig.secure = false;
      }

      transportConfig.connectionTimeout = 30000;
      transportConfig.greetingTimeout = 30000;

      this.transporter = nodemailer.createTransport(transportConfig);

      console.log('Email service initialized successfully with nodemailer');
      console.log('SMTP Host:', EMAIL_HOST);
      console.log('SMTP Port:', EMAIL_PORT);
      console.log('SMTP User:', EMAIL_USER);
      console.log('From address:', this.fromAddress);
      console.log('Secure mode:', transportConfig.secure ? 'SSL/TLS' : 'STARTTLS');
    } catch (error) {
      console.error('Failed to initialize email service:', error);
    }
  }

  async sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.error('[Email Service] Email service not initialized - missing configuration');
      console.error('[Email Service] Check EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD environment variables');
      return false;
    }

    try {
      console.log('[Email Service] Attempting to send email to:', to);
      console.log('[Email Service] Subject:', subject);
      
      const info = await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromAddress}>`,
        to,
        subject,
        html,
      });

      console.log('[Email Service] Email sent successfully to:', to);
      console.log('[Email Service] Message ID:', info.messageId);
      return true;
    } catch (error: any) {
      console.error('[Email Service] Failed to send email to:', to);
      console.error('[Email Service] Error code:', error.code);
      console.error('[Email Service] Error message:', error.message);
      if (error.code === 'ECONNREFUSED') {
        console.error('[Email Service] Connection refused - SMTP port may be blocked. Try port 2525 for cloud hosting.');
      } else if (error.code === 'ETIMEDOUT') {
        console.error('[Email Service] Connection timed out - SMTP port may be blocked by firewall.');
      } else if (error.code === 'EAUTH') {
        console.error('[Email Service] Authentication failed - check EMAIL_USER and EMAIL_PASSWORD.');
      }
      console.error('[Email Service] Full error:', error);
      return false;
    }
  }

  generateOTP(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  hashOTP(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  verifyOTP(inputOTP: string, hashedOTP: string): boolean {
    const inputHash = this.hashOTP(inputOTP);
    return crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(hashedOTP));
  }

  async sendVerificationCode(email: string, code: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1E8FF2 0%, #1565C0 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .content { padding: 40px 30px; }
          .code-box { background: #f8f9fa; border: 2px dashed #1E8FF2; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0; }
          .code { font-size: 36px; font-weight: bold; color: #1E8FF2; letter-spacing: 8px; font-family: 'Courier New', monospace; }
          .info { color: #666; font-size: 14px; margin-top: 20px; }
          .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #999; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Lumirra Wallet</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your Verification Code</p>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You requested a verification code to access your Lumirra Wallet account. Please use the code below to complete your authentication:</p>
            
            <div class="code-box">
              <div class="code">${code}</div>
              <p class="info">This code will expire in 10 minutes</p>
            </div>
            
            <div class="warning">
              <strong>Security Notice:</strong> Never share this code with anyone. Lumirra staff will never ask for your verification code.
            </div>
            
            <p>If you didn't request this code, please ignore this email or contact our support team if you have concerns about your account security.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Lumirra Wallet. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Your Lumirra Wallet Verification Code',
      html,
    });
  }

  async sendPasswordResetCode(email: string, code: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1E8FF2 0%, #1565C0 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .content { padding: 40px 30px; }
          .code-box { background: #f0f7ff; border: 2px dashed #1E8FF2; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0; }
          .code { font-size: 36px; font-weight: bold; color: #1E8FF2; letter-spacing: 8px; font-family: 'Courier New', monospace; }
          .info { color: #666; font-size: 14px; margin-top: 20px; }
          .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #999; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Lumirra Wallet</p>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You requested to reset your Lumirra Wallet password. Use the verification code below to proceed with your password reset:</p>
            
            <div class="code-box">
              <div class="code">${code}</div>
              <p class="info">This code will expire in 10 minutes</p>
            </div>
            
            <div class="warning">
              <strong>Security Alert:</strong> If you didn't request a password reset, please contact our support team immediately to secure your account.
            </div>
            
            <p>For your security, this verification code can only be used once.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Lumirra Wallet. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Lumirra Wallet - Password Reset Code',
      html,
    });
  }

  async sendWelcomeEmail(email: string, username: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1E8FF2 0%, #1565C0 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 32px; font-weight: 600; }
          .content { padding: 40px 30px; }
          .feature { margin: 20px 0; padding: 15px; background: #f0f7ff; border-left: 4px solid #1E8FF2; border-radius: 4px; }
          .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Lumirra!</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${username}</strong>,</p>
            <p>Welcome to Lumirra Wallet! Your account has been successfully created and you're ready to start managing your crypto assets securely.</p>
            
            <div class="feature">
              <strong>Multi-Chain Support</strong>
              <p style="margin: 5px 0 0 0; color: #666;">Manage assets across Ethereum, BSC, Polygon, Solana, and more</p>
            </div>
            
            <div class="feature">
              <strong>Instant Swaps</strong>
              <p style="margin: 5px 0 0 0; color: #666;">Swap between cryptocurrencies seamlessly</p>
            </div>
            
            <div class="feature">
              <strong>Bank-Grade Security</strong>
              <p style="margin: 5px 0 0 0; color: #666;">Your assets are protected with enterprise-level security</p>
            </div>
            
            <p style="margin-top: 30px;">If you have any questions or need assistance, our support team is here to help.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Lumirra Wallet. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Welcome to Lumirra Wallet!',
      html,
    });
  }

  async sendCryptoReceived(email: string, username: string, amount: string, token: string, txHash: string, chain: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1E8FF2 0%, #1565C0 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .content { padding: 40px 30px; }
          .amount-box { background: #f0f7ff; border: 2px solid #1E8FF2; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0; }
          .amount { font-size: 32px; font-weight: bold; color: #1E8FF2; }
          .details { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 4px; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { font-weight: 600; color: #666; }
          .detail-value { color: #333; word-break: break-all; }
          .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #999; font-size: 12px; }
          .button { display: inline-block; margin-top: 20px; padding: 12px 30px; background: #1E8FF2; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Crypto Received</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Lumirra Wallet</p>
          </div>
          <div class="content">
            <p>Hello <strong>${username}</strong>,</p>
            <p>You've successfully received cryptocurrency in your Lumirra Wallet!</p>
            
            <div class="amount-box">
              <div class="amount">+${amount} ${token}</div>
            </div>
            
            <div class="details">
              <div class="detail-row">
                <span class="detail-label">Transaction Hash:</span>
                <span class="detail-value">${txHash.substring(0, 10)}...${txHash.substring(txHash.length - 8)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Network:</span>
                <span class="detail-value">${chain}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value" style="color: #4caf50; font-weight: 600;">Completed</span>
              </div>
            </div>
            
            <p style="text-align: center;">
              <a href="https://yourapp.com/transactions" class="button">View Transaction Details</a>
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Lumirra Wallet. All rights reserved.</p>
            <p>This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `Received ${amount} ${token} - Lumirra Wallet`,
      html,
    });
  }

  async sendCryptoSent(email: string, username: string, amount: string, token: string, txHash: string, chain: string, recipientAddress: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1E8FF2 0%, #1565C0 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .content { padding: 40px 30px; }
          .amount-box { background: #fff8f0; border: 2px solid #ff9800; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0; }
          .amount { font-size: 32px; font-weight: bold; color: #ff9800; }
          .details { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 4px; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { font-weight: 600; color: #666; }
          .detail-value { color: #333; word-break: break-all; }
          .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #999; font-size: 12px; }
          .button { display: inline-block; margin-top: 20px; padding: 12px 30px; background: #1E8FF2; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Crypto Sent</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Lumirra Wallet</p>
          </div>
          <div class="content">
            <p>Hello <strong>${username}</strong>,</p>
            <p>You've successfully sent cryptocurrency from your Lumirra Wallet!</p>
            
            <div class="amount-box">
              <div class="amount">-${amount} ${token}</div>
            </div>
            
            <div class="details">
              <div class="detail-row">
                <span class="detail-label">Recipient:</span>
                <span class="detail-value">${recipientAddress.substring(0, 10)}...${recipientAddress.substring(recipientAddress.length - 8)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Transaction Hash:</span>
                <span class="detail-value">${txHash.substring(0, 10)}...${txHash.substring(txHash.length - 8)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Network:</span>
                <span class="detail-value">${chain}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value" style="color: #4caf50; font-weight: 600;">Completed</span>
              </div>
            </div>
            
            <p style="text-align: center;">
              <a href="https://yourapp.com/transactions" class="button">View Transaction Details</a>
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Lumirra Wallet. All rights reserved.</p>
            <p>This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `Sent ${amount} ${token} - Lumirra Wallet`,
      html,
    });
  }

  async sendContactUsNotification(name: string, email: string, message: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1677FF 0%, #2ED8FF 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .content { padding: 40px 30px; }
          .message-box { background: #f8f9fa; border-left: 4px solid #1677FF; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .detail-row { margin: 10px 0; }
          .detail-label { font-weight: 600; color: #666; }
          .detail-value { color: #333; }
          .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Contact Form Submission</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Lumirra Wallet</p>
          </div>
          <div class="content">
            <p>You have received a new contact form submission:</p>
            
            <div class="detail-row">
              <span class="detail-label">Name:</span>
              <span class="detail-value"> ${name}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Email:</span>
              <span class="detail-value"> ${email}</span>
            </div>
            
            <div class="message-box">
              <div class="detail-label">Message:</div>
              <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${message}</p>
            </div>
            
            <p style="margin-top: 30px; color: #666;">Please respond to this inquiry at your earliest convenience.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Lumirra Wallet. All rights reserved.</p>
            <p>This is an automated notification from your contact form.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send to admin email if set, otherwise fall back to from address
    const adminEmail = process.env.ADMIN_EMAIL || this.fromAddress;
    
    return this.sendEmail({
      to: adminEmail,
      subject: `New Contact Form Submission from ${name}`,
      html,
    });
  }

  async sendSupportReply(to: string, name: string, originalMessage: string, replyMessage: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1677FF 0%, #2ED8FF 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .content { padding: 40px 30px; }
          .message-box { background: #f8f9fa; border-left: 4px solid #1677FF; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .original-message { background: #fff; border: 1px solid #e0e0e0; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .detail-label { font-weight: 600; color: #666; font-size: 12px; text-transform: uppercase; }
          .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Support Team Response</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Lumirra Wallet</p>
          </div>
          <div class="content">
            <p>Dear ${name},</p>
            <p>Thank you for contacting Lumirra Wallet support. We have reviewed your inquiry and here is our response:</p>
            
            <div class="message-box">
              <div class="detail-label">Our Response:</div>
              <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${replyMessage}</p>
            </div>
            
            <div class="original-message">
              <div class="detail-label">Your Original Message:</div>
              <p style="margin: 10px 0 0 0; white-space: pre-wrap; color: #666;">${originalMessage}</p>
            </div>
            
            <p style="margin-top: 30px;">If you have any further questions, please don't hesitate to reach out to us again.</p>
            <p>Best regards,<br>Lumirra Wallet Support Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Lumirra Wallet. All rights reserved.</p>
            <p>This email was sent in response to your support inquiry.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: 'Response to Your Support Inquiry - Lumirra Wallet',
      html,
    });
  }

  async sendSupportMessage(to: string, name: string, message: string, subject: string = 'Message from Lumirra Wallet Support'): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1677FF 0%, #2ED8FF 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .content { padding: 40px 30px; }
          .message-box { background: #f8f9fa; border-left: 4px solid #1677FF; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Message from Support</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Lumirra Wallet</p>
          </div>
          <div class="content">
            <p>Dear ${name},</p>
            
            <div class="message-box">
              <p style="margin: 0; white-space: pre-wrap;">${message}</p>
            </div>
            
            <p style="margin-top: 30px;">If you have any questions or need assistance, please don't hesitate to reach out to our support team.</p>
            <p>Best regards,<br>Lumirra Wallet Support Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Lumirra Wallet. All rights reserved.</p>
            <p>This is a message from Lumirra Wallet Support.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendSupportChatFirstMessageAlert(userName: string, userEmail: string, message: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #0084ff 0%, #0066cc 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .content { padding: 40px 30px; }
          .message-box { background: #f0f7ff; border-left: 4px solid #0084ff; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .detail-row { margin: 10px 0; }
          .detail-label { font-weight: 600; color: #666; }
          .detail-value { color: #333; }
          .badge { display: inline-block; background: #0084ff; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
          .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Support Chat Message</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Lumirra Wallet</p>
          </div>
          <div class="content">
            <p><span class="badge">NEW USER</span></p>
            <p>A new user has started a support chat conversation and is waiting for assistance:</p>
            
            <div class="detail-row">
              <span class="detail-label">User:</span>
              <span class="detail-value"> ${userName}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Email:</span>
              <span class="detail-value"> ${userEmail}</span>
            </div>
            
            <div class="message-box">
              <div class="detail-label">First Message:</div>
              <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${message}</p>
            </div>
            
            <p style="margin-top: 30px; color: #666; font-weight: 600;">Please log in to the admin panel to respond to this support request.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Lumirra Wallet. All rights reserved.</p>
            <p>This is an automated notification from your support chat system.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send to admin email if set, otherwise fall back to from address
    const adminEmail = process.env.ADMIN_EMAIL || this.fromAddress;
    
    return this.sendEmail({
      to: adminEmail,
      subject: `New Support Chat from ${userName}`,
      html,
    });
  }
}

export const emailService = new EmailService();
