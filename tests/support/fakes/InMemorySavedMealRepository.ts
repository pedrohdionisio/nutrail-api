import type { SavedMealRepository } from '@/application/ports/SavedMealRepository';
import type { SavedMeal } from '@/domain/entities/SavedMeal';
import { copySavedMeal, type InMemoryDatabase } from './InMemoryDatabase';

export class InMemorySavedMealRepository implements SavedMealRepository {
  constructor(private readonly db: InMemoryDatabase) {}

  async findById(
    userId: string,
    savedMealId: string,
  ): Promise<SavedMeal | null> {
    const savedMeal = this.db.savedMeals.get(savedMealId);

    return savedMeal?.userId === userId ? copySavedMeal(savedMeal) : null;
  }

  async create(savedMeal: SavedMeal): Promise<void> {
    if (this.db.savedMeals.has(savedMeal.id)) {
      throw new Error(`Saved meal ${savedMeal.id} already exists.`);
    }

    this.db.putSavedMeal(savedMeal);
  }

  async delete(userId: string, savedMealId: string): Promise<boolean> {
    if (this.db.savedMeals.get(savedMealId)?.userId !== userId) return false;

    return this.db.savedMeals.delete(savedMealId);
  }
}
