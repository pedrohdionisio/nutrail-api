import type { CustomMessageTriggerEvent } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import { handler } from '@/main/functions/customMessage';

function buildEvent(
  triggerSource: string,
  clientMetadata?: Record<string, string>,
): CustomMessageTriggerEvent {
  return {
    triggerSource,
    request: { codeParameter: '{####}', userAttributes: {}, clientMetadata },
    response: { emailSubject: null, emailMessage: null, smsMessage: null },
  } as unknown as CustomMessageTriggerEvent;
}

describe('Cognito custom message', () => {
  it('should render the password recovery email with the code placeholder', async () => {
    const event = await handler(buildEvent('CustomMessage_ForgotPassword'));

    expect(event.response.emailSubject).toBe(
      'Nutrail | Recupere a sua conta 🔑',
    );
    expect(event.response.emailMessage).toContain('{####}');
    expect(event.response.emailMessage).toContain('<html');
  });

  it('should render the password recovery email in the language of the request', async () => {
    const event = await handler(
      buildEvent('CustomMessage_ForgotPassword', { language: 'en-US' }),
    );

    expect(event.response.emailSubject).toBe(
      'Nutrail | Recover your account 🔑',
    );
    expect(event.response.emailMessage).toContain('Recover your account');
    expect(event.response.emailMessage).toContain('{####}');
  });

  it('should keep the default message of other triggers', async () => {
    const event = await handler(buildEvent('CustomMessage_AdminCreateUser'));

    expect(event.response.emailSubject).toBeNull();
    expect(event.response.emailMessage).toBeNull();
  });
});
