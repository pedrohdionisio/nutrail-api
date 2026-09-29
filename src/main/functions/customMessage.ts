import type { CustomMessageTriggerEvent } from 'aws-lambda';
import { createElement } from 'react';
import { render } from 'react-email';
import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  type Language,
} from '@/domain/value-objects/Language';
import ForgotPassword, {
  forgotPasswordSubject,
} from '@/infra/email/templates/ForgotPassword';

export async function handler(event: CustomMessageTriggerEvent) {
  if (event.triggerSource === 'CustomMessage_ForgotPassword') {
    const language = toLanguage(event.request.clientMetadata?.language);

    event.response.emailSubject = forgotPasswordSubject(language);
    event.response.emailMessage = await render(
      createElement(ForgotPassword, {
        code: event.request.codeParameter,
        language,
      }),
    );
  }

  return event;
}

function toLanguage(value: string | undefined): Language {
  return LANGUAGES.find((language) => language === value) ?? DEFAULT_LANGUAGE;
}
