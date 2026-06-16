import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import crypto from 'crypto';
import { Resend } from 'resend';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private resendClient: Resend | null = null;
  private fromAddress: string = '';
  private fromName: string = 'Lumirra Wallet';
  private useResend: boolean = false;

  constructor() {
    this.initializeTransporter();
    this.initializeResend();
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
      console.warn('[Email Service] SMTP configuration incomplete.');
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

      console.log('[Email Service] SMTP initialized');
      console.log('[Email Service] SMTP Host:', EMAIL_HOST);
      console.log('[Email Service] SMTP Port:', EMAIL_PORT);
      console.log('[Email Service] From address:', this.fromAddress);
    } catch (error) {
      console.error('[Email Service] Failed to initialize SMTP:', error);
    }
  }

  private async initializeResend() {
    const { RESEND_API_KEY, EMAIL_FROM } = process.env;
    
    if (RESEND_API_KEY) {
      try {
        this.resendClient = new Resend(RESEND_API_KEY);
        this.useResend = true;
        if (!this.fromAddress && EMAIL_FROM) {
          this.fromAddress = EMAIL_FROM;
        }
        console.log('[Email Service] Resend initialized (primary or fallback)');
      } catch (error) {
        console.error('[Email Service] Failed to initialize Resend:', error);
      }
    } else {
      try {
        const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
        const xReplitToken = process.env.REPL_IDENTITY 
          ? 'repl ' + process.env.REPL_IDENTITY 
          : process.env.WEB_REPL_RENEWAL 
          ? 'depl ' + process.env.WEB_REPL_RENEWAL 
          : null;

        if (hostname && xReplitToken) {
          const response = await fetch(
            'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
            {
              headers: {
                'Accept': 'application/json',
                'X_REPLIT_TOKEN': xReplitToken
              }
            }
          );
          const data = await response.json();
          const connectionSettings = data.items?.[0];

          if (connectionSettings?.settings?.api_key) {
            this.resendClient = new Resend(connectionSettings.settings.api_key);
            if (connectionSettings.settings.from_email && !this.fromAddress) {
              this.fromAddress = connectionSettings.settings.from_email;
            }
            console.log('[Email Service] Resend initialized via Replit connector');
          }
        }
      } catch (error) {
        console.log('[Email Service] Replit Resend connector not available');
      }
    }

    if (!this.transporter && !this.resendClient) {
      console.warn('[Email Service] No email service configured. Set SMTP or RESEND_API_KEY.');
    }
  }

  private async sendViaResend({ to, subject, html }: EmailOptions): Promise<boolean> {
    if (!this.resendClient) {
      return false;
    }

    try {
      console.log('[Email Service] Sending via Resend to:', to);
      
      const { data, error } = await this.resendClient.emails.send({
        from: `${this.fromName} <${this.fromAddress || 'onboarding@resend.dev'}>`,
        to: [to],
        subject,
        html,
      });

      if (error) {
        console.error('[Email Service] Resend error:', error);
        return false;
      }

      console.log('[Email Service] Email sent successfully via Resend');
      console.log('[Email Service] Message ID:', data?.id);
      return true;
    } catch (error: any) {
      console.error('[Email Service] Resend failed:', error.message);
      return false;
    }
  }

  private async sendViaSMTP({ to, subject, html }: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      console.log('[Email Service] Sending via SMTP to:', to);
      
      const info = await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromAddress}>`,
        to,
        subject,
        html,
      });

      console.log('[Email Service] Email sent successfully via SMTP');
      console.log('[Email Service] Message ID:', info.messageId);
      return true;
    } catch (error: any) {
      console.error('[Email Service] SMTP failed:', error.code, error.message);
      if (error.code === 'ESOCKET' || error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        console.error('[Email Service] SMTP port blocked - will try Resend fallback');
      }
      return false;
    }
  }

  async sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
    console.log('[Email Service] Attempting to send email to:', to);
    console.log('[Email Service] Subject:', subject);

    if (this.useResend && this.resendClient) {
      const result = await this.sendViaResend({ to, subject, html });
      if (result) return true;
    }

    if (this.transporter) {
      const result = await this.sendViaSMTP({ to, subject, html });
      if (result) return true;

      if (this.resendClient) {
        console.log('[Email Service] SMTP failed, falling back to Resend...');
        return await this.sendViaResend({ to, subject, html });
      }
    }

    if (this.resendClient) {
      return await this.sendViaResend({ to, subject, html });
    }

    console.error('[Email Service] No email service available');
    return false;
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

  async sendSupportChatFirstMessageAlert(email: string, userName: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Support Chat Started',
      html: `<p>Hello Admin, ${userName} has started a new support chat.</p>`,
    });
  }

  async sendSupportMessage(email: string, subject: string, message: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: subject,
      html: `<p>${message}</p>`,
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

  async sendSupportNumberUpdate(email: string, firstName: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1E3A8A 0%, #1565C0 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 15px; }
          .content { padding: 40px 30px; }
          .highlight-box { background: #f0f7ff; border: 2px solid #1E8FF2; border-radius: 8px; padding: 24px 30px; text-align: center; margin: 30px 0; }
          .phone { font-size: 28px; font-weight: bold; color: #1565C0; letter-spacing: 1px; }
          .label { font-size: 13px; color: #888; margin-top: 8px; }
          .info { color: #555; font-size: 15px; margin: 20px 0; }
          .divider { border: none; border-top: 1px solid #e0e0e0; margin: 30px 0; }
          .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Lumirra Wallet</h1>
            <p>Important Support Update</p>
          </div>
          <div class="content">
            <p class="info">Dear <strong>${firstName}</strong>,</p>
            <p class="info">We want to let you know that our customer support contact number has been updated. Please save our new support number for any future assistance you may need.</p>

            <div class="highlight-box">
              <div class="phone">+1 (601) 440-0158</div>
              <div class="label">New Lumirra Wallet Support Number</div>
            </div>

            <p class="info">Our support team is available to assist you with any questions or issues regarding your wallet, transactions, or account. Don't hesitate to reach out.</p>

            <hr class="divider" />

            <p class="info" style="font-size: 13px; color: #888;">If you did not expect this email, please disregard it. Your account security has not been affected.</p>
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
      subject: 'Lumirra Wallet - Updated Support Contact Number',
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
            <p>Hello <strong>${name}</strong>,</p>
            <p>Our support team has responded to your inquiry:</p>
            
            <div class="message-box">
              <p style="margin: 0; white-space: pre-wrap;">${replyMessage}</p>
            </div>
            
            <div class="original-message">
              <div class="detail-label">Your Original Message:</div>
              <p style="margin: 10px 0 0 0; color: #666; white-space: pre-wrap;">${originalMessage}</p>
            </div>
            
            <p style="margin-top: 30px;">If you have any further questions, please don't hesitate to reach out to us again.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Lumirra Wallet. All rights reserved.</p>
            <p>This is an automated notification. Please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: 'Response from Lumirra Wallet Support',
      html,
    });
  }

  async sendDirectMessage(to: string, name: string, message: string, subject?: string): Promise<boolean> {
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
            <h1>Message from Lumirra Wallet</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${name}</strong>,</p>
            
            <div class="message-box">
              <p style="margin: 0; white-space: pre-wrap;">${message}</p>
            </div>
            
            <p style="margin-top: 30px;">If you have any questions, please don't hesitate to contact our support team.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Lumirra Wallet. All rights reserved.</p>
            <p>This is an automated notification. Please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: subject || 'Message from Lumirra Wallet Support',
      html,
    });
  }

  async sendAddressCopiedAlert(adminEmail: string, userInfo: { name: string; email: string; address: string; token: string; chain: string; location: string; userAgent: string; ip: string; time: string }): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #FF6B00 0%, #E65100 100%); color: white; padding: 36px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 26px; font-weight: 700; }
          .header p { margin: 8px 0 0 0; opacity: 0.9; font-size: 14px; }
          .content { padding: 36px 30px; }
          .alert-box { background: #fff3e0; border: 2px solid #FF6B00; border-radius: 8px; padding: 20px; margin: 24px 0; }
          .address { font-family: 'Courier New', monospace; font-size: 13px; background: #f5f5f5; padding: 10px 14px; border-radius: 6px; word-break: break-all; margin: 10px 0; color: #1a1a1a; }
          .details { margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { font-weight: 600; color: #555; font-size: 13px; }
          .detail-value { color: #333; font-size: 13px; word-break: break-all; text-align: right; max-width: 60%; }
          .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Address Copied Alert</h1>
            <p>A user just copied a receive address</p>
          </div>
          <div class="content">
            <p>Hello Admin,</p>
            <p>A user has tapped and copied their wallet address on the Receive QR page.</p>
            <div class="alert-box">
              <strong>Copied Address:</strong>
              <div class="address">${userInfo.address}</div>
              <small style="color:#888;">Token: ${userInfo.token} | Chain: ${userInfo.chain}</small>
            </div>
            <div class="details">
              <div class="detail-row">
                <span class="detail-label">User Name</span>
                <span class="detail-value">${userInfo.name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">User Email</span>
                <span class="detail-value">${userInfo.email}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Detected Location</span>
                <span class="detail-value">${userInfo.location}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">IP Address</span>
                <span class="detail-value">${userInfo.ip}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Device / Browser</span>
                <span class="detail-value">${userInfo.userAgent}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time</span>
                <span class="detail-value">${userInfo.time}</span>
              </div>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Lumirra Wallet — Admin Alert System</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: adminEmail,
      subject: `[Lumirra Alert] Address Copied — ${userInfo.name} (${userInfo.email})`,
      html,
    });
  }

  async sendNewUserAlert(adminEmail: string, userInfo: { name: string; email: string; dob: string; walletAddress: string; location: string; ip: string; userAgent: string; time: string }): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1E8FF2 0%, #0D47A1 100%); color: white; padding: 36px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 26px; font-weight: 700; }
          .header p { margin: 8px 0 0 0; opacity: 0.9; font-size: 14px; }
          .content { padding: 36px 30px; }
          .new-user-box { background: #e8f4fd; border: 2px solid #1E8FF2; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center; }
          .new-user-name { font-size: 22px; font-weight: bold; color: #0D47A1; }
          .new-user-email { font-size: 15px; color: #555; margin-top: 4px; }
          .address { font-family: 'Courier New', monospace; font-size: 12px; background: #f5f5f5; padding: 10px 14px; border-radius: 6px; word-break: break-all; margin: 10px 0; color: #1a1a1a; }
          .details { margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { font-weight: 600; color: #555; font-size: 13px; }
          .detail-value { color: #333; font-size: 13px; word-break: break-all; text-align: right; max-width: 60%; }
          .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New User Registered</h1>
            <p>A new wallet has been created on Lumirra</p>
          </div>
          <div class="content">
            <p>Hello Admin,</p>
            <p>A new user has successfully created a wallet on Lumirra Wallet.</p>
            <div class="new-user-box">
              <div class="new-user-name">${userInfo.name}</div>
              <div class="new-user-email">${userInfo.email}</div>
            </div>
            <strong>Wallet Address:</strong>
            <div class="address">${userInfo.walletAddress || 'Not yet generated'}</div>
            <div class="details">
              <div class="detail-row">
                <span class="detail-label">Date of Birth</span>
                <span class="detail-value">${userInfo.dob}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Detected Location</span>
                <span class="detail-value">${userInfo.location}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">IP Address</span>
                <span class="detail-value">${userInfo.ip}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Device / Browser</span>
                <span class="detail-value">${userInfo.userAgent}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Registration Time</span>
                <span class="detail-value">${userInfo.time}</span>
              </div>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Lumirra Wallet — Admin Alert System</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: adminEmail,
      subject: `[Lumirra] New User: ${userInfo.name} (${userInfo.email})`,
      html,
    });
  }

  async sendWithdrawalApprovalRequest(
    adminEmail: string,
    details: {
      userName: string;
      userEmail: string;
      amount: string;
      tokenSymbol: string;
      chainId: string;
      toAddress: string;
      txHash: string;
      time: string;
    }
  ) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #1e293b; border-radius: 12px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #1d4ed8, #0ea5e9); padding: 32px 40px; text-align: center; }
          .header h1 { margin: 0; color: #fff; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
          .header p { margin: 6px 0 0; color: rgba(255,255,255,0.8); font-size: 14px; }
          .body { padding: 32px 40px; }
          .badge { display: inline-block; background: #f59e0b; color: #1e293b; border-radius: 6px; padding: 4px 12px; font-size: 12px; font-weight: 700; letter-spacing: 1px; margin-bottom: 20px; }
          .amount-box { background: #0f172a; border-radius: 10px; padding: 20px 24px; text-align: center; margin: 20px 0; }
          .amount-box .amt { font-size: 32px; font-weight: 800; color: #38bdf8; }
          .amount-box .sym { font-size: 18px; color: #94a3b8; margin-left: 8px; }
          .detail-table { width: 100%; border-collapse: collapse; margin: 24px 0; }
          .detail-table tr td { padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 14px; }
          .detail-table tr:last-child td { border-bottom: none; }
          .detail-table .lbl { color: #94a3b8; width: 140px; }
          .detail-table .val { color: #e2e8f0; font-weight: 500; word-break: break-all; }
          .action-area { background: #0f172a; border-radius: 10px; padding: 20px 24px; margin: 24px 0; text-align: center; }
          .action-area p { margin: 0 0 8px; color: #94a3b8; font-size: 13px; }
          .admin-link { color: #38bdf8; font-weight: 600; font-size: 14px; }
          .footer { padding: 20px 40px; text-align: center; color: #475569; font-size: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Withdrawal Approval Required</h1>
            <p>A user has initiated a crypto withdrawal</p>
          </div>
          <div class="body">
            <span class="badge">ACTION NEEDED</span>
            <div class="amount-box">
              <span class="amt">${details.amount}</span>
              <span class="sym">${details.tokenSymbol}</span>
            </div>
            <table class="detail-table">
              <tr>
                <td class="lbl">User</td>
                <td class="val">${details.userName} &lt;${details.userEmail}&gt;</td>
              </tr>
              <tr>
                <td class="lbl">Chain</td>
                <td class="val">${details.chainId}</td>
              </tr>
              <tr>
                <td class="lbl">Destination</td>
                <td class="val">${details.toAddress}</td>
              </tr>
              <tr>
                <td class="lbl">Tx Hash</td>
                <td class="val">${details.txHash}</td>
              </tr>
              <tr>
                <td class="lbl">Requested At</td>
                <td class="val">${details.time}</td>
              </tr>
            </table>
            <div class="action-area">
              <p>Log in to the admin panel to approve or reject this withdrawal.</p>
              <a class="admin-link" href="https://lumirra.app/admin/withdrawal-approvals">Open Admin Panel &rarr;</a>
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Lumirra Wallet — Admin Notification System
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: adminEmail,
      subject: `[Lumirra] Withdrawal Approval Needed — ${details.amount} ${details.tokenSymbol}`,
      html,
    });
  }
}

export const emailService = new EmailService();
