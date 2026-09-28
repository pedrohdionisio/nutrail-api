import type { CustomMessageTriggerEvent } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import { handler } from '@/main/functions/customMessage';

function buildEvent(triggerSource: string): CustomMessageTriggerEvent {
  return {
    triggerSource,
    request: { codeParameter: '{####}', userAttributes: {} },
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

  it('should keep the default message of other triggers', async () => {
    const event = await handler(buildEvent('CustomMessage_AdminCreateUser'));

    expect(event.response.emailSubject).toBeNull();
    expect(event.response.emailMessage).toBeNull();
  });
});
