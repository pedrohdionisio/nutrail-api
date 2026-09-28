import { describe, expect, it } from 'vitest';
import { InvalidRefreshTokenError } from '@/application/errors/InvalidRefreshTokenError';
import { RefreshTokenUseCase } from '@/application/usecases/auth/RefreshTokenUseCase';
import { createFakes } from '../../../support/fakes/createFakes';

describe('RefreshTokenUseCase', () => {
  it('should renew the tokens', async () => {
    const f = createFakes();
    f.auth.addAccount({
      externalId: 'sub-1',
      email: 'ana@nutrail.test',
      password: 'senha',
    });

    await expect(
      new RefreshTokenUseCase(f.auth).execute('refresh-sub-1'),
    ).resolves.toEqual({
      accessToken: 'access-sub-1',
      refreshToken: 'refresh-sub-1',
    });
  });

  it('should reject an invalid refresh token', async () => {
    await expect(
      new RefreshTokenUseCase(createFakes().auth).execute('expired'),
    ).rejects.toThrow(InvalidRefreshTokenError);
  });
});
