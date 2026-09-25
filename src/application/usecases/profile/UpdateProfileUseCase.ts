import { UserNotFoundError } from '@/application/errors/UserNotFoundError';
import { Clock } from '@/application/ports/Clock';
import { UserRepository } from '@/application/ports/UserRepository';
import { User, type UserProfile } from '@/domain/entities/User';
import { GoalCalculator } from '@/domain/services/GoalCalculator';
import type { Macros } from '@/domain/value-objects/Macros';
import { Injectable } from '@/kernel/decorators/Injectable';

type Input = {
  userId: string;
  profile: UserProfile;
};

@Injectable()
export class UpdateProfileUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly goalCalculator: GoalCalculator,
    private readonly clock: Clock,
  ) {}

  async execute({ userId, profile }: Input): Promise<{ goals: Macros }> {
    const user = await this.users.findById(userId);

    if (!user) {
      throw new UserNotFoundError();
    }

    const goals = this.goalCalculator.calculate(profile, this.clock.now());

    await this.users.update(new User({ ...user, ...profile, goals }));

    return { goals };
  }
}
