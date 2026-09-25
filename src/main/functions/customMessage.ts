import type { CustomMessageTriggerEvent } from 'aws-lambda';
import { createElement } from 'react';
import { render } from 'react-email';
import ForgotPassword from '@/infra/email/templates/ForgotPassword';

export async function handler(event: CustomMessageTriggerEvent) {
  if (event.triggerSource === 'CustomMessage_ForgotPassword') {
    event.response.emailSubject = 'Nutrail | Recupere a sua conta 🔑';
    event.response.emailMessage = await render(
      createElement(ForgotPassword, { code: event.request.codeParameter }),
    );
  }

  return event;
}
