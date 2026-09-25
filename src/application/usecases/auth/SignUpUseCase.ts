import {
  AuthProvider,
  type AuthTokens,
  type Credentials,
} from '@/application/ports/AuthProvider';
import { Clock } from '@/application/ports/Clock';
import { EmailSender } from '@/application/ports/EmailSender';
import { IdGenerator } from '@/application/ports/IdGenerator';
import { UserRepository } from '@/application/ports/UserRepository';
import { Saga } from '@/application/services/Saga';
import { User, type UserProfile } from '@/domain/entities/User';
import { GoalCalculator } from '@/domain/services/GoalCalculator';
import { Injectable } from '@/kernel/decorators/Injectable';

type Input = {
  account: Credentials;
  profile: UserProfile;
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
  ) {}

  async execute({ account, profile }: Input): Promise<AuthTokens> {
    const now = this.clock.now();
    const goals = this.goalCalculator.calculate(profile, now);
    const id = this.ids.generate();

    await this.saga.run(async () => {
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

    await this.sendWelcomeEmail(account.email, profile.name);

    return this.auth.signIn(account);
  }

  private async sendWelcomeEmail(to: string, name: string): Promise<void> {
    try {
      await this.emails.send({ to, template: 'WELCOME', data: { name } });
    } catch (error) {
      console.error('Failed to send welcome email.', error);
    }
  }
}
