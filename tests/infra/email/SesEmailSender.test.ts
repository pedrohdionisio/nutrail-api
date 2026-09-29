import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { mockClient } from 'aws-sdk-client-mock';
import { describe, expect, it } from 'vitest';
import { SesEmailSender } from '@/infra/email/SesEmailSender';
import { AppConfig } from '@/shared/config/AppConfig';

function setup() {
  const client = new SESv2Client({});
  const mock = mockClient(client);
  mock.on(SendEmailCommand).resolves({});

  return { mock, sender: new SesEmailSender(client, new AppConfig()) };
}

describe('SesEmailSender', () => {
  it('should render the welcome template as html and text and send it', async () => {
    const { mock, sender } = setup();

    await sender.send({
      to: 'ana@nutrail.test',
      template: 'WELCOME',
      data: { name: 'Ana Souza' },
      language: 'pt-BR',
    });

    const input = mock.commandCalls(SendEmailCommand)[0]?.args[0].input;
    const content = input?.Content?.Simple;
    expect(input?.FromEmailAddress).toBe('Nutrail <no-reply@nutrail.test>');
    expect(input?.Destination).toEqual({ ToAddresses: ['ana@nutrail.test'] });
    expect(content?.Subject).toEqual({
      Data: 'Bem-vindo ao Nutrail! 🥗',
      Charset: 'UTF-8',
    });
    expect(content?.Body?.Html?.Data).toContain('<html');
    expect(content?.Body?.Html?.Data).toContain('Ana Souza');
    expect(content?.Body?.Text?.Data).toMatch(/ana souza/i);
    expect(content?.Body?.Text?.Data).not.toContain('<');
  });

  it('should send the welcome e-mail in English', async () => {
    const { mock, sender } = setup();

    await sender.send({
      to: 'ana@nutrail.test',
      template: 'WELCOME',
      data: { name: 'Ana Souza' },
      language: 'en-US',
    });

    const content =
      mock.commandCalls(SendEmailCommand)[0]?.args[0].input.Content?.Simple;
    expect(content?.Subject?.Data).toBe('Welcome to Nutrail! 🥗');
    expect(content?.Body?.Html?.Data).toContain('lang="en-US"');
    expect(content?.Body?.Text?.Data).toMatch(/welcome to nutrail/i);
  });
});
