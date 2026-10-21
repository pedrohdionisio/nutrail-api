import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmailAlreadyInUseError } from '@/application/errors/EmailAlreadyInUseError';
import { InvalidInviteCodeError } from '@/application/errors/InvalidInviteCodeError';
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
      f.invites,
    );
    f.db.putInvite('NUTRAIL-BETA');
  });

  it('should create the account and the user with calculated goals, then sign in', async () => {
    const tokens = await signUp.execute({
      inviteCode: 'NUTRAIL-BETA',
      account: ACCOUNT,
      profile: buildProfile(),
      language: 'pt-BR',
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

  it('should send the welcome email in the language of the sign-up', async () => {
    await signUp.execute({
      inviteCode: 'NUTRAIL-BETA',
      account: ACCOUNT,
      profile: buildProfile(),
      language: 'en-US',
    });

    expect(f.emails.sent).toEqual([
      {
        to: 'ana@nutrail.test',
        template: 'WELCOME',
        data: { name: 'Ana Souza' },
        language: 'en-US',
      },
    ]);
  });

  it('should still sign in when the welcome email fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    f.emails.error = new Error('SES is down');

    await expect(
      signUp.execute({
        inviteCode: 'NUTRAIL-BETA',
        account: ACCOUNT,
        profile: buildProfile(),
        language: 'pt-BR',
      }),
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
      signUp.execute({
        inviteCode: 'NUTRAIL-BETA',
        account: ACCOUNT,
        profile: buildProfile(),
        language: 'pt-BR',
      }),
    ).rejects.toThrow('DynamoDB is down');
    expect(f.auth.deletedExternalIds).toEqual(['sub-new-1']);
    expect(f.auth.accounts.size).toBe(0);
    expect(f.emails.sent).toEqual([]);
    expect(f.db.invites.get('NUTRAIL-BETA')?.uses).toBe(0);
  });

  it('should not create the user when the email is already in use', async () => {
    f.auth.addAccount({
      externalId: 'sub-1',
      email: ACCOUNT.email,
      password: 'outra',
    });

    await expect(
      signUp.execute({
        inviteCode: 'NUTRAIL-BETA',
        account: ACCOUNT,
        profile: buildProfile(),
        language: 'pt-BR',
      }),
    ).rejects.toThrow(EmailAlreadyInUseError);
    expect(f.db.users.size).toBe(0);
    expect(f.db.invites.get('NUTRAIL-BETA')?.uses).toBe(0);
  });

  it('should use one of the uses of the invite', async () => {
    await signUp.execute({
      inviteCode: 'NUTRAIL-BETA',
      account: ACCOUNT,
      profile: buildProfile(),
      language: 'pt-BR',
    });

    expect(f.db.invites.get('NUTRAIL-BETA')).toEqual({ maxUses: 1, uses: 1 });
  });

  it.each([
    ['an unknown invite', 'NOPE'],
    ['an invite with no uses left', 'USED'],
  ])('should refuse %s without creating the account', async (_, code) => {
    f.db.putInvite('USED', 0);

    await expect(
      signUp.execute({
        inviteCode: code,
        account: ACCOUNT,
        profile: buildProfile(),
        language: 'pt-BR',
      }),
    ).rejects.toThrow(InvalidInviteCodeError);
    expect(f.auth.accounts.size).toBe(0);
    expect(f.db.users.size).toBe(0);
  });
});
