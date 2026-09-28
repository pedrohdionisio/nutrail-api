import { describe, expect, it, vi } from 'vitest';
import { handler as getMe } from '@/main/functions/getMe';
import { handler as signIn } from '@/main/functions/signIn';
import { errorBody, fakes, givenSignedInUser, invoke } from '../../support/app';

describe('lambdaHttpAdapter', () => {
  it('should answer 401 when the token belongs to no user', async () => {
    expect(await invoke(getMe, { as: { externalId: 'sub-unknown' } })).toEqual({
      statusCode: 401,
      body: errorBody('UNAUTHORIZED'),
    });
  });

  it('should answer 404 when the user of a valid token has no profile', async () => {
    const user = givenSignedInUser();
    vi.spyOn(fakes().getProfile, 'execute').mockResolvedValue(null);

    expect(await invoke(getMe, { as: user })).toEqual({
      statusCode: 404,
      body: errorBody('USER_NOT_FOUND'),
    });
  });

  it('should answer 400 for a body that is not JSON', async () => {
    expect(await invoke(signIn, { rawBody: '{ email: ' })).toEqual({
      statusCode: 400,
      body: errorBody('INVALID_JSON'),
    });
  });

  it('should decode base64 bodies', async () => {
    fakes().auth.addAccount({
      externalId: 'sub-1',
      email: 'ana@nutrail.test',
      password: 'senha',
    });
    const body = Buffer.from(
      JSON.stringify({ email: 'ana@nutrail.test', password: 'senha' }),
    ).toString('base64');

    expect(
      await invoke(signIn, { rawBody: body, isBase64Encoded: true }),
    ).toMatchObject({
      statusCode: 200,
      body: { accessToken: 'access-sub-1' },
    });
  });

  it('should list every invalid field with its message', async () => {
    expect(await invoke(signIn, { body: {} })).toEqual({
      statusCode: 400,
      body: {
        error: {
          code: 'VALIDATION',
          message: 'Invalid request.',
          details: [
            { field: 'email', message: expect.any(String) },
            { field: 'password', message: expect.any(String) },
          ],
        },
      },
    });
  });

  it('should hide unexpected errors behind a generic 500', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    vi.spyOn(fakes().auth, 'signIn').mockRejectedValue(
      new Error('Cognito exploded'),
    );

    expect(
      await invoke(signIn, {
        body: { email: 'ana@nutrail.test', password: 'senha' },
      }),
    ).toEqual({
      statusCode: 500,
      body: { error: { code: 'INTERNAL', message: 'Internal server error.' } },
    });
    expect(consoleError).toHaveBeenCalled();
  });
});
