import { describe, expect, it } from 'vitest';
import { handler } from '@/main/functions/confirmForgotPassword';
import {
  errorBody,
  fakes,
  invoke,
  validationErrorBody,
} from '../../support/app';
import { RESET_CODE } from '../../support/fakes/FakeAuthProvider';

describe('POST /auth/forgot-password/confirm', () => {
  it('should set the new password', async () => {
    fakes().auth.addAccount({
      externalId: 'sub-1',
      email: 'ana@nutrail.test',
      password: 'antiga',
    });

    const response = await invoke(handler, {
      body: {
        email: 'ana@nutrail.test',
        code: RESET_CODE,
        password: 'nova-senha',
      },
    });

    expect(response.statusCode).toBe(204);
    expect(fakes().auth.accounts.get('ana@nutrail.test')?.password).toBe(
      'nova-senha',
    );
  });

  it('should answer 400 for an invalid code', async () => {
    fakes().auth.addAccount({
      externalId: 'sub-1',
      email: 'ana@nutrail.test',
      password: 'antiga',
    });

    expect(
      await invoke(handler, {
        body: {
          email: 'ana@nutrail.test',
          code: '000000',
          password: 'nova-senha',
        },
      }),
    ).toEqual({ statusCode: 400, body: errorBody('INVALID_CODE') });
  });

  it('should require a password with at least 8 characters', async () => {
    expect(
      await invoke(handler, {
        body: {
          email: 'ana@nutrail.test',
          code: RESET_CODE,
          password: 'curta',
        },
      }),
    ).toEqual({ statusCode: 400, body: validationErrorBody('password') });
  });
});
