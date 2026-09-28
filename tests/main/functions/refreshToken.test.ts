import { describe, expect, it } from 'vitest';
import { handler } from '@/main/functions/refreshToken';
import {
  errorBody,
  fakes,
  invoke,
  validationErrorBody,
} from '../../support/app';

describe('POST /auth/refresh-token', () => {
  it('should renew the tokens', async () => {
    fakes().auth.addAccount({
      externalId: 'sub-1',
      email: 'ana@nutrail.test',
      password: 'senha',
    });

    expect(
      await invoke(handler, { body: { refreshToken: 'refresh-sub-1' } }),
    ).toEqual({
      statusCode: 200,
      body: { accessToken: 'access-sub-1', refreshToken: 'refresh-sub-1' },
    });
  });

  it('should answer 401 for an invalid refresh token', async () => {
    expect(
      await invoke(handler, { body: { refreshToken: 'expired' } }),
    ).toEqual({
      statusCode: 401,
      body: errorBody('INVALID_REFRESH_TOKEN'),
    });
  });

  it('should require the refresh token', async () => {
    expect(await invoke(handler, { body: {} })).toEqual({
      statusCode: 400,
      body: validationErrorBody('refreshToken'),
    });
  });
});
