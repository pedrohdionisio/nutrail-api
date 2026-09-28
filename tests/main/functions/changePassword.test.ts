import { describe, expect, it } from 'vitest';
import { handler } from '@/main/functions/changePassword';
import {
  errorBody,
  fakes,
  givenSignedInUser,
  invoke,
  validationErrorBody,
} from '../../support/app';

describe('PUT /me/password', () => {
  it('should change the password', async () => {
    const user = givenSignedInUser();

    const response = await invoke(handler, {
      as: user,
      body: { currentPassword: 'senha-atual', newPassword: 'nova-senha' },
    });

    expect(response.statusCode).toBe(204);
    expect(fakes().auth.accounts.get(user.email)?.password).toBe('nova-senha');
  });

  it('should explain when the current password is wrong', async () => {
    const user = givenSignedInUser();

    expect(
      await invoke(handler, {
        as: user,
        body: { currentPassword: 'errada', newPassword: 'nova-senha' },
      }),
    ).toEqual({ statusCode: 400, body: errorBody('INVALID_CURRENT_PASSWORD') });
  });

  it('should require a new password with at least 8 characters', async () => {
    const user = givenSignedInUser();

    expect(
      await invoke(handler, {
        as: user,
        body: { currentPassword: 'senha-atual', newPassword: '123' },
      }),
    ).toEqual({ statusCode: 400, body: validationErrorBody('newPassword') });
  });
});
