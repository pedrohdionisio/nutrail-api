import type { Language } from '@/domain/value-objects/Language';

export type EmailTemplates = {
  WELCOME: { name: string };
};

export type EmailMessage<T extends keyof EmailTemplates> = {
  to: string;
  template: T;
  data: EmailTemplates[T];
  language: Language;
};

export abstract class EmailSender {
  abstract send<T extends keyof EmailTemplates>(
    message: EmailMessage<T>,
  ): Promise<void>;
}
