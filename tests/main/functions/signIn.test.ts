import { describe, expect, it } from 'vitest';
import { handler } from '@/main/functions/signIn';
import {
  errorBody,
  fakes,
  invoke,
  validationErrorBody,
} from '../../support/app';

describe('POST /auth/sign-in', () => {
  it('should return the tokens of valid credentials', async () => {
    fakes().auth.addAccount({
      externalId: 'sub-1',
      email: 'ana@nutrail.test',
      password: 'senha',
    });

    expect(
      await invoke(handler, {
        body: { email: 'ana@nutrail.test', password: 'senha' },
      }),
    ).toEqual({
      statusCode: 200,
      body: { accessToken: 'access-sub-1', refreshToken: 'refresh-sub-1' },
    });
  });

  it('should answer 401 for invalid credentials', async () => {
    expect(
      await invoke(handler, {
        body: { email: 'ana@nutrail.test', password: 'errada' },
      }),
    ).toEqual({ statusCode: 401, body: errorBody('INVALID_CREDENTIALS') });
  });

  it('should validate the body', async () => {
    expect(
      await invoke(handler, { body: { email: 'ana', password: '' } }),
    ).toEqual({
      statusCode: 400,
      body: validationErrorBody('email', 'password'),
    });
  });
});
