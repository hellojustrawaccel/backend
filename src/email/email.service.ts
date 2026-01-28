import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EmailSendOptions, IEmailProvider } from './email-provider.interface';
import { ResendProvider } from './providers/resend.provider';

@Injectable()
export class EmailService implements IEmailProvider {
  private readonly logger = new Logger(EmailService.name);
  private provider: IEmailProvider;

  constructor(private configService: ConfigService) {
    this.provider = new ResendProvider(this.configService);
    this.logger.log('EmailService initialized');
  }

  async sendEmail(options: EmailSendOptions): Promise<void> {
    return this.provider.sendEmail(options);
  }

  async sendEmailVerification(email: string, code: string): Promise<void> {
    return this.provider.sendEmailVerification(email, code);
  }

  async sendLoginCode(email: string, code: string): Promise<void> {
    return this.provider.sendLoginCode(email, code);
  }

  async sendPendingActivation(email: string, username: string): Promise<void> {
    return this.provider.sendPendingActivation(email, username);
  }

  async sendActivationNotification(email: string): Promise<void> {
    return this.provider.sendActivationNotification(email);
  }
}
