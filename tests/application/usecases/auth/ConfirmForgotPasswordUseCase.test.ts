import { describe, expect, it } from 'vitest';
import { InvalidCodeError } from '@/application/errors/InvalidCodeError';
import { ConfirmForgotPasswordUseCase } from '@/application/usecases/auth/ConfirmForgotPasswordUseCase';
import { createFakes } from '../../../support/fakes/createFakes';
import { RESET_CODE } from '../../../support/fakes/FakeAuthProvider';

describe('ConfirmForgotPasswordUseCase', () => {
  it('should set the new password with a valid code', async () => {
    const f = createFakes();
    f.auth.addAccount({
      externalId: 'sub-1',
      email: 'ana@nutrail.test',
      password: 'antiga',
    });

    await new ConfirmForgotPasswordUseCase(f.auth).execute({
      email: 'ana@nutrail.test',
      code: RESET_CODE,
      password: 'nova-senha',
    });

    expect(f.auth.accounts.get('ana@nutrail.test')?.password).toBe(
      'nova-senha',
    );
  });

  it('should reject an invalid code', async () => {
    const f = createFakes();
    f.auth.addAccount({
      externalId: 'sub-1',
      email: 'ana@nutrail.test',
      password: 'antiga',
    });

    await expect(
      new ConfirmForgotPasswordUseCase(f.auth).execute({
        email: 'ana@nutrail.test',
        code: '000000',
        password: 'nova-senha',
      }),
    ).rejects.toThrow(InvalidCodeError);
  });
});
