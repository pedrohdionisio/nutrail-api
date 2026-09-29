import { describe, expect, it } from 'vitest';
import { ForgotPasswordUseCase } from '@/application/usecases/auth/ForgotPasswordUseCase';
import { createFakes } from '../../../support/fakes/createFakes';

describe('ForgotPasswordUseCase', () => {
  it('should ask the auth provider to send the reset code', async () => {
    const f = createFakes();

    await new ForgotPasswordUseCase(f.auth).execute({
      email: 'ana@nutrail.test',
      language: 'en-US',
    });

    expect(f.auth.resetRequests).toEqual([
      { email: 'ana@nutrail.test', language: 'en-US' },
    ]);
  });
});
