import { describe, expect, it } from 'vitest';
import { InvalidCredentialsError } from '@/application/errors/InvalidCredentialsError';
import { SignInUseCase } from '@/application/usecases/auth/SignInUseCase';
import { createFakes } from '../../../support/fakes/createFakes';

describe('SignInUseCase', () => {
  it('should return the tokens of valid credentials', async () => {
    const f = createFakes();
    f.auth.addAccount({
      externalId: 'sub-1',
      email: 'ana@nutrail.test',
      password: 'senha',
    });

    await expect(
      new SignInUseCase(f.auth).execute({
        email: 'ana@nutrail.test',
        password: 'senha',
      }),
    ).resolves.toEqual({
      accessToken: 'access-sub-1',
      refreshToken: 'refresh-sub-1',
    });
  });

  it('should reject invalid credentials', async () => {
    const f = createFakes();

    await expect(
      new SignInUseCase(f.auth).execute({
        email: 'ana@nutrail.test',
        password: 'senha',
      }),
    ).rejects.toThrow(InvalidCredentialsError);
  });
});
