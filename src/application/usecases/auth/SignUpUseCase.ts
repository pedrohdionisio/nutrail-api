import { InvalidInviteCodeError } from '@/application/errors/InvalidInviteCodeError';
import {
  AuthProvider,
  type AuthTokens,
  type Credentials,
} from '@/application/ports/AuthProvider';
import { Clock } from '@/application/ports/Clock';
import { EmailSender } from '@/application/ports/EmailSender';
import { IdGenerator } from '@/application/ports/IdGenerator';
import { InviteCodes } from '@/application/ports/InviteCodes';
import { UserRepository } from '@/application/ports/UserRepository';
import { Saga } from '@/application/services/Saga';
import { User, type UserProfile } from '@/domain/entities/User';
import { GoalCalculator } from '@/domain/services/GoalCalculator';
import type { Language } from '@/domain/value-objects/Language';
import { Injectable } from '@/kernel/decorators/Injectable';

type Input = {
  inviteCode: string;
  account: Credentials;
  profile: UserProfile;
  language: Language;
};

@Injectable()
export class SignUpUseCase {
  constructor(
    private readonly auth: AuthProvider,
    private readonly users: UserRepository,
    private readonly goalCalculator: GoalCalculator,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
    private readonly saga: Saga,
    private readonly emails: EmailSender,
    private readonly invites: InviteCodes,
  ) {}

  async execute({
    inviteCode,
    account,
    profile,
    language,
  }: Input): Promise<AuthTokens> {
    const now = this.clock.now();
    const goals = this.goalCalculator.calculate(profile, now);
    const id = this.ids.generate();

    await this.saga.run(async () => {
      if (!(await this.invites.redeem(inviteCode))) {
        throw new InvalidInviteCodeError();
      }

      this.saga.addCompensation(() => this.invites.release(inviteCode));

      const { externalId } = await this.auth.signUp(account);
      this.saga.addCompensation(() => this.auth.deleteUser(externalId));

      await this.users.create(
        new User({
          ...profile,
          id,
          externalId,
          email: account.email,
          goals,
          createdAt: now.toISOString(),
        }),
      );
    });

    await this.sendWelcomeEmail(account.email, profile.name, language);

    return this.auth.signIn(account);
  }

  private async sendWelcomeEmail(
    to: string,
    name: string,
    language: Language,
  ): Promise<void> {
    try {
      await this.emails.send({
        to,
        template: 'WELCOME',
        data: { name },
        language,
      });
    } catch (error) {
      console.error('Failed to send welcome email.', error);
    }
  }
}
