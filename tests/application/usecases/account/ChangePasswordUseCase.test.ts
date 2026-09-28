import { beforeEach, describe, expect, it } from 'vitest';
import { InvalidCurrentPasswordError } from '@/application/errors/InvalidCurrentPasswordError';
import { UserNotFoundError } from '@/application/errors/UserNotFoundError';
import { ChangePasswordUseCase } from '@/application/usecases/account/ChangePasswordUseCase';
import { createFakes, type Fakes } from '../../../support/fakes/createFakes';
import { buildUser } from '../../../support/fixtures/user';

describe('ChangePasswordUseCase', () => {
  let f: Fakes;
  let changePassword: ChangePasswordUseCase;

  beforeEach(() => {
    f = createFakes();
    changePassword = new ChangePasswordUseCase(f.users, f.auth);
    f.db.putUser(buildUser());
    f.auth.addAccount({
      externalId: 'sub-1',
      email: 'ana@nutrail.test',
      password: 'atual',
    });
  });

  it('should change the password of the user account', async () => {
    await changePassword.execute({
      userId: 'user-1',
      currentPassword: 'atual',
      newPassword: 'nova-senha',
    });

    expect(f.auth.accounts.get('ana@nutrail.test')?.password).toBe(
      'nova-senha',
    );
  });

  it('should reject a wrong current password', async () => {
    await expect(
      changePassword.execute({
        userId: 'user-1',
        currentPassword: 'errada',
        newPassword: 'nova',
      }),
    ).rejects.toThrow(InvalidCurrentPasswordError);
  });

  it('should fail for an unknown user', async () => {
    await expect(
      changePassword.execute({
        userId: 'nobody',
        currentPassword: 'atual',
        newPassword: 'nova',
      }),
    ).rejects.toThrow(UserNotFoundError);
  });
});
