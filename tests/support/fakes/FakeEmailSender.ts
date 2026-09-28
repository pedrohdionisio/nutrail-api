import type {
  EmailMessage,
  EmailSender,
  EmailTemplates,
} from '@/application/ports/EmailSender';

export class FakeEmailSender implements EmailSender {
  readonly sent: EmailMessage<keyof EmailTemplates>[] = [];
  error: Error | null = null;

  async send<T extends keyof EmailTemplates>(
    message: EmailMessage<T>,
  ): Promise<void> {
    if (this.error) throw this.error;

    this.sent.push(message);
  }
}
