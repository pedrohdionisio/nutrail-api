import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmailAlreadyInUseError } from '@/application/errors/EmailAlreadyInUseError';
import { Saga } from '@/application/services/Saga';
import { SignUpUseCase } from '@/application/usecases/auth/SignUpUseCase';
import { GoalCalculator } from '@/domain/services/GoalCalculator';
import { createFakes, type Fakes } from '../../../support/fakes/createFakes';
import { buildProfile } from '../../../support/fixtures/user';

const ACCOUNT = { email: 'ana@nutrail.test', password: 'senha-forte' };

describe('SignUpUseCase', () => {
  let f: Fakes;
  let signUp: SignUpUseCase;

  beforeEach(() => {
    f = createFakes();
    signUp = new SignUpUseCase(
      f.auth,
      f.users,
      new GoalCalculator(),
      f.ids,
      f.clock,
      new Saga(),
      f.emails,
    );
  });

  it('should create the account and the user with calculated goals, then sign in', async () => {
    const tokens = await signUp.execute({
      account: ACCOUNT,
      profile: buildProfile(),
    });

    expect(tokens).toEqual({
      accessToken: 'access-sub-new-1',
      refreshToken: 'refresh-sub-new-1',
    });
    expect(f.db.users.get('id-1')).toMatchObject({
      id: 'id-1',
      externalId: 'sub-new-1',
      email: 'ana@nutrail.test',
      name: 'Ana Souza',
      goals: { calories: 1539, protein: 120, carbohydrate: 143, fat: 54 },
      createdAt: '2026-09-26T15:00:00.000Z',
    });
  });

  it('should send the welcome email', async () => {
    await signUp.execute({ account: ACCOUNT, profile: buildProfile() });

    expect(f.emails.sent).toEqual([
      {
        to: 'ana@nutrail.test',
        template: 'WELCOME',
        data: { name: 'Ana Souza' },
      },
    ]);
  });

  it('should still sign in when the welcome email fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    f.emails.error = new Error('SES is down');

    await expect(
      signUp.execute({ account: ACCOUNT, profile: buildProfile() }),
    ).resolves.toEqual({
      accessToken: 'access-sub-new-1',
      refreshToken: 'refresh-sub-new-1',
    });
  });

  it('should delete the account when the user cannot be saved', async () => {
    vi.spyOn(f.users, 'create').mockRejectedValue(
      new Error('DynamoDB is down'),
    );

    await expect(
      signUp.execute({ account: ACCOUNT, profile: buildProfile() }),
    ).rejects.toThrow('DynamoDB is down');
    expect(f.auth.deletedExternalIds).toEqual(['sub-new-1']);
    expect(f.auth.accounts.size).toBe(0);
    expect(f.emails.sent).toEqual([]);
  });

  it('should not create the user when the email is already in use', async () => {
    f.auth.addAccount({
      externalId: 'sub-1',
      email: ACCOUNT.email,
      password: 'outra',
    });

    await expect(
      signUp.execute({ account: ACCOUNT, profile: buildProfile() }),
    ).rejects.toThrow(EmailAlreadyInUseError);
    expect(f.db.users.size).toBe(0);
  });
});
