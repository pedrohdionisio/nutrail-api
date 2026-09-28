import type { MealItem } from '@/domain/entities/Meal';
import type { Macros } from '@/domain/value-objects/Macros';

export type SavedMealDetails = Macros & {
  id: string;
  name: string;
  items: MealItem[];
  createdAt: string;
};

export abstract class ListSavedMealsQuery {
  abstract execute(userId: string): Promise<SavedMealDetails[]>;
}
