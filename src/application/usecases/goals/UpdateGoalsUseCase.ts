import { UserNotFoundError } from '@/application/errors/UserNotFoundError';
import { UserRepository } from '@/application/ports/UserRepository';
import { User } from '@/domain/entities/User';
import { GoalCalculator } from '@/domain/services/GoalCalculator';
import type { Macros } from '@/domain/value-objects/Macros';
import { Injectable } from '@/kernel/decorators/Injectable';

type Input = {
  userId: string;
  goals: { calories: number } | Omit<Macros, 'calories'>;
};

@Injectable()
export class UpdateGoalsUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly goalCalculator: GoalCalculator,
  ) {}

  async execute({ userId, goals }: Input): Promise<{ goals: Macros }> {
    const user = await this.users.findById(userId);

    if (!user) {
      throw new UserNotFoundError();
    }

    const updatedGoals =
      'calories' in goals
        ? this.goalCalculator.fromCalories(goals.calories, user.goals)
        : this.goalCalculator.fromMacros(goals);

    await this.users.update(new User({ ...user, goals: updatedGoals }));

    return { goals: updatedGoals };
  }
}
