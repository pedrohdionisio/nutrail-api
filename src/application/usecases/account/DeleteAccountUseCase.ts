import { UserNotFoundError } from '@/application/errors/UserNotFoundError';
import { AuthProvider } from '@/application/ports/AuthProvider';
import { FileStorage } from '@/application/ports/FileStorage';
import { UserRepository } from '@/application/ports/UserRepository';
import { MEAL_FILES } from '@/application/services/mealFiles';
import { Injectable } from '@/kernel/decorators/Injectable';

@Injectable()
export class DeleteAccountUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly auth: AuthProvider,
    private readonly storage: FileStorage,
  ) {}

  async execute(userId: string): Promise<void> {
    const user = await this.users.findById(userId);

    if (!user) {
      throw new UserNotFoundError();
    }

    await Promise.all(
      Object.values(MEAL_FILES).map(({ folder }) =>
        this.storage.deleteByPrefix(`${folder}/${userId}/`),
      ),
    );

    await this.auth.deleteUser(user.externalId);
    await this.users.deleteWithAllData(userId);
  }
}
