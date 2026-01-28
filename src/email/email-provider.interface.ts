export interface EmailSendOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface IEmailProvider {
  sendEmail(options: EmailSendOptions): Promise<void>;
  sendEmailVerification(email: string, code: string): Promise<void>;
  sendLoginCode(email: string, code: string): Promise<void>;
  sendPendingActivation(email: string, username: string): Promise<void>;
  sendActivationNotification(email: string): Promise<void>;
}
