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
    expect(fakes().auth.resetRequests).toEqual(['ana@nutrail.test']);
  });

  it('should require a valid email', async () => {
    expect(await invoke(handler, { body: { email: 'ana' } })).toEqual({
      statusCode: 400,
      body: validationErrorBody('email'),
    });
  });
});
