import type { Meal } from '@/domain/entities/Meal';

export abstract class MealRepository {
  abstract create(meal: Meal): Promise<void>;
}
