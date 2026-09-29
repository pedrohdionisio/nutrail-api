import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { createElement, type ReactElement } from 'react';
import { render } from 'react-email';
import type {
  EmailMessage,
  EmailSender,
  EmailTemplates,
} from '@/application/ports/EmailSender';
import type { Language } from '@/domain/value-objects/Language';
import { Injectable } from '@/kernel/decorators/Injectable';
import { AppConfig } from '@/shared/config/AppConfig';
import Welcome, { welcomeSubject } from './templates/Welcome';

const templates: {
  [T in keyof EmailTemplates]: {
    subject: (language: Language) => string;
    component: (
      props: EmailTemplates[T] & { language: Language },
    ) => ReactElement;
  };
} = {
  WELCOME: { subject: welcomeSubject, component: Welcome },
};

@Injectable()
export class SesEmailSender implements EmailSender {
  constructor(
    private readonly client: SESv2Client,
    private readonly config: AppConfig,
  ) {}

  async send<T extends keyof EmailTemplates>({
    to,
    template,
    data,
    language,
  }: EmailMessage<T>): Promise<void> {
    const { subject, component } = templates[template];
    const element = createElement(component, { ...data, language });

    const [html, text] = await Promise.all([
      render(element),
      render(element, { plainText: true }),
    ]);

    await this.client.send(
      new SendEmailCommand({
        FromEmailAddress: this.config.email.from,
        Destination: { ToAddresses: [to] },
        Content: {
          Simple: {
            Subject: { Data: subject(language), Charset: 'UTF-8' },
            Body: {
              Html: { Data: html, Charset: 'UTF-8' },
              Text: { Data: text, Charset: 'UTF-8' },
            },
          },
        },
      }),
    );
  }
}
