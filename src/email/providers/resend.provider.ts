import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

import { EmailSendOptions, IEmailProvider } from '../email-provider.interface';

@Injectable()
export class ResendProvider implements IEmailProvider {
  private readonly logger = new Logger(ResendProvider.name);

  private resend: Resend;
  private fromEmail: string;
  private appName: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.fromEmail = this.configService.get<string>('EMAIL_FROM')!;
    this.appName = this.configService.get<string>('APP_NAME') || 'Book';

    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY not configured');
    } else {
      this.resend = new Resend(apiKey);
      this.logger.log(`Resend provider initialized`);
    }
  }

  async sendEmail(options: EmailSendOptions): Promise<void> {
    if (!this.resend) {
      this.logger.warn('Resend not configured, skipping email send');
      return;
    }

    try {
      const emailOptions: any = {
        from: this.fromEmail,
        to: options.to,
        subject: options.subject,
      };

      if (options.html) {
        emailOptions.html = options.html;
      }
      if (options.text) {
        emailOptions.text = options.text;
      }

      await this.resend.emails.send(emailOptions);

      this.logger.log(`Email sent to ${options.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      throw error;
    }
  }

  async sendEmailVerification(email: string, code: string): Promise<void> {
    const subject = `Verify your email for ${this.appName}`;
    const text = `Your email verification code is: ${code}\n\nThis code will expire in 15 minutes.`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .code-box { background: #f4f4f4; border: 2px solid #ddd; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2563eb; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Welcome to ${this.appName}!</h2>
            <p>Thank you for registering. Please verify your email address by entering the code below:</p>
            <div class="code-box">
              <div class="code">${code}</div>
            </div>
            <p><strong>This code will expire in 15 minutes.</strong></p>
            <p>After verification, your account will be reviewed by an administrator and activated within 1-3 days.</p>
            <div class="footer">
              <p>This is an automated message from ${this.appName}. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({ to: email, subject, text, html });
  }

  async sendLoginCode(email: string, code: string): Promise<void> {
    const subject = `Your login code for ${this.appName}`;
    const text = `Your login code is: ${code}\n\nThis code will expire in 5 minutes.`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .code-box { background: #f4f4f4; border: 2px solid #ddd; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2563eb; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Login Code</h2>
            <p>You requested a login code for <strong>${this.appName}</strong>.</p>
            <div class="code-box">
              <div class="code">${code}</div>
            </div>
            <p>Enter this code to complete your login.</p>
            <p><strong>This code will expire in 5 minutes.</strong></p>
            <p>If you didn't request this code, you can safely ignore this email.</p>
            <div class="footer">
              <p>This is an automated message from ${this.appName}. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({ to: email, subject, text, html });
  }

  async sendPendingActivation(email: string, username: string): Promise<void> {
    const subject = `Email verified - Activation pending`;
    const text = `Hello ${username},\n\nYour email has been successfully verified!\n\nYour account is now pending activation by an administrator. This typically takes 1-3 days.\n\nYou will receive another email once your account is activated and you can start logging in.\n\nThank you for your patience!`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .info-box { background: #fffbeb; border: 2px solid #fbbf24; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>✅ Email Verified!</h2>
            <p>Hello <strong>${username}</strong>,</p>
            <p>Your email has been successfully verified!</p>
            <div class="info-box">
              <p><strong>⏳ Activation Pending</strong></p>
              <p>Your account is now pending activation by an administrator. This typically takes 1-3 days.</p>
              <p>You will receive another email once your account is activated and you can start logging in.</p>
            </div>
            <p>Thank you for your patience!</p>
            <div class="footer">
              <p>This is an automated message from ${this.appName}. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({ to: email, subject, text, html });
  }

  async sendActivationNotification(email: string): Promise<void> {
    const subject = `Your ${this.appName} account has been activated`;
    const text = `Great news! Your account has been activated by an administrator.\n\nYou can now log in and start using ${this.appName}.`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .success-box { background: #f0fdf4; border: 2px solid #86efac; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>🎉 Account Activated!</h2>
            <div class="success-box">
              <p><strong>Great news!</strong> Your account has been activated by an administrator.</p>
            </div>
            <p>You can now log in and start using all features of ${this.appName}.</p>
            <div class="footer">
              <p>This is an automated message from ${this.appName}. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({ to: email, subject, text, html });
  }
}
