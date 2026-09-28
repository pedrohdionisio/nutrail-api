import type { MealInputType, MealStatus } from '@/domain/entities/Meal';
import type { Macros } from '@/domain/value-objects/Macros';

export type MealSummary = Macros & {
  id: string;
  name: string | null;
  status: MealStatus;
  inputType: MealInputType;
  time: string;
  pictureKey: string | null;
  createdAt: string;
};

export type MealsOfDay = {
  meals: MealSummary[];
  totals: Macros;
};

export abstract class ListMealsByDayQuery {
  abstract execute(input: {
    userId: string;
    date: string;
  }): Promise<MealsOfDay>;
}
