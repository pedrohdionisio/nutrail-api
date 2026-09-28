import { SavedMealNotFoundError } from '@/application/errors/SavedMealNotFoundError';
import { SavedMealRepository } from '@/application/ports/SavedMealRepository';
import { Injectable } from '@/kernel/decorators/Injectable';

type Input = {
  userId: string;
  savedMealId: string;
};

@Injectable()
export class DeleteSavedMealUseCase {
  constructor(private readonly savedMeals: SavedMealRepository) {}

  async execute({ userId, savedMealId }: Input): Promise<void> {
    const deleted = await this.savedMeals.delete(userId, savedMealId);

    if (!deleted) {
      throw new SavedMealNotFoundError();
    }
  }
}
