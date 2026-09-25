import { UserNotFoundError } from '@/application/errors/UserNotFoundError';
import { UserRepository } from '@/application/ports/UserRepository';
import { User } from '@/domain/entities/User';
import type { Macros } from '@/domain/value-objects/Macros';
import { Injectable } from '@/kernel/decorators/Injectable';

type Input = {
  userId: string;
  goals: Macros;
};

@Injectable()
export class UpdateGoalsUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute({ userId, goals }: Input): Promise<void> {
    const user = await this.users.findById(userId);

    if (!user) {
      throw new UserNotFoundError();
    }

    await this.users.update(new User({ ...user, goals }));
  }
}
