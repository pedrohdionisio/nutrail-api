import { UserNotFoundError } from '@/application/errors/UserNotFoundError';
import { AuthProvider } from '@/application/ports/AuthProvider';
import { UserRepository } from '@/application/ports/UserRepository';
import { Injectable } from '@/kernel/decorators/Injectable';

type Input = {
  userId: string;
  currentPassword: string;
  newPassword: string;
};

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly auth: AuthProvider,
  ) {}

  async execute({
    userId,
    currentPassword,
    newPassword,
  }: Input): Promise<void> {
    const user = await this.users.findById(userId);

    if (!user) {
      throw new UserNotFoundError();
    }

    await this.auth.changePassword({
      externalId: user.externalId,
      email: user.email,
      currentPassword,
      newPassword,
    });
  }
}
