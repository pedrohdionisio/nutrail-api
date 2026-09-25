import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { createElement, type ReactElement } from 'react';
import { render } from 'react-email';
import type {
  EmailMessage,
  EmailSender,
  EmailTemplates,
} from '@/application/ports/EmailSender';
import { Injectable } from '@/kernel/decorators/Injectable';
import { AppConfig } from '@/shared/config/AppConfig';
import Welcome from './templates/Welcome';

const templates: {
  [T in keyof EmailTemplates]: {
    subject: string;
    component: (props: EmailTemplates[T]) => ReactElement;
  };
} = {
  WELCOME: { subject: 'Bem-vindo ao Nutrail! 🥗', component: Welcome },
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
  }: EmailMessage<T>): Promise<void> {
    const { subject, component } = templates[template];
    const element = createElement(component, data);

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
            Subject: { Data: subject, Charset: 'UTF-8' },
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
