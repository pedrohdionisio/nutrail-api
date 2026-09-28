import { describe, expect, it } from 'vitest';
import { handler } from '@/main/functions/signUp';
import {
  errorBody,
  fakes,
  invoke,
  validationErrorBody,
} from '../../support/app';
import { buildProfile } from '../../support/fixtures/user';

const BODY = {
  account: { email: 'ana@nutrail.test', password: 'senha-forte' },
  profile: buildProfile(),
};

describe('POST /auth/sign-up', () => {
  it('should create the account with calculated goals and return the tokens', async () => {
    const response = await invoke(handler, { body: BODY });

    expect(response).toEqual({
      statusCode: 201,
      body: {
        accessToken: 'access-sub-new-1',
        refreshToken: 'refresh-sub-new-1',
      },
    });
    expect(fakes().db.users.get('id-1')).toMatchObject({
      email: 'ana@nutrail.test',
      goals: { calories: 1539, protein: 120, carbohydrate: 143, fat: 54 },
    });
    expect(fakes().emails.sent).toHaveLength(1);
  });

  it('should refuse an email already in use', async () => {
    fakes().auth.addAccount({
      externalId: 'sub-1',
      email: 'ana@nutrail.test',
      password: 'x',
    });

    expect(await invoke(handler, { body: BODY })).toEqual({
      statusCode: 409,
      body: errorBody('EMAIL_ALREADY_IN_USE'),
    });
  });

  it('should validate the account and the profile', async () => {
    const response = await invoke(handler, {
      body: {
        account: { email: 'not-an-email', password: 'short' },
        profile: {
          ...buildProfile(),
          height: 0,
          birthDate: '2999-01-01',
          goal: 'BULK',
        },
      },
    });

    expect(response).toEqual({
      statusCode: 400,
      body: validationErrorBody(
        'account.email',
        'account.password',
        'profile.height',
        'profile.birthDate',
        'profile.goal',
      ),
    });
    expect(fakes().auth.accounts.size).toBe(0);
  });
});
