import { describe, expect, it } from 'vitest';
import { handler } from '@/main/functions/forgotPassword';
import { fakes, invoke, validationErrorBody } from '../../support/app';

describe('POST /auth/forgot-password', () => {
  it('should request the reset code and answer without a body', async () => {
    expect(
      await invoke(handler, { body: { email: 'ana@nutrail.test' } }),
    ).toEqual({
      statusCode: 204,
      body: undefined,
    });
    expect(fakes().auth.resetRequests).toEqual([
      { email: 'ana@nutrail.test', language: 'pt-BR' },
    ]);
  });

  it('should send the code in the language the app asks for', async () => {
    await invoke(handler, {
      body: { email: 'ana@nutrail.test' },
      acceptLanguage: 'en-US,en;q=0.9,pt-BR;q=0.8',
    });

    expect(fakes().auth.resetRequests).toEqual([
      { email: 'ana@nutrail.test', language: 'en-US' },
    ]);
  });

  it('should fall back to Portuguese for a language the app does not offer', async () => {
    await invoke(handler, {
      body: { email: 'ana@nutrail.test' },
      acceptLanguage: 'fr-FR',
    });

    expect(fakes().auth.resetRequests).toEqual([
      { email: 'ana@nutrail.test', language: 'pt-BR' },
    ]);
  });

  it('should require a valid email', async () => {
    expect(await invoke(handler, { body: { email: 'ana' } })).toEqual({
      statusCode: 400,
      body: validationErrorBody('email'),
    });
  });
});
