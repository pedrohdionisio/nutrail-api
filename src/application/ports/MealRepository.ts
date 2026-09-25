import type { Meal } from '@/domain/entities/Meal';

export abstract class MealRepository {
  abstract findById(userId: string, mealId: string): Promise<Meal | null>;

  abstract create(meal: Meal): Promise<void>;

  abstract update(meal: Meal): Promise<void>;
}
