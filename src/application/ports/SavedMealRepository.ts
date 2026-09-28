import type { SavedMeal } from '@/domain/entities/SavedMeal';

export abstract class SavedMealRepository {
  abstract findById(
    userId: string,
    savedMealId: string,
  ): Promise<SavedMeal | null>;

  abstract create(savedMeal: SavedMeal): Promise<void>;

  abstract delete(userId: string, savedMealId: string): Promise<boolean>;
}
