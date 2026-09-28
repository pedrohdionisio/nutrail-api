import type {
  MealInputType,
  MealItem,
  MealStatus,
} from '@/domain/entities/Meal';
import type { Macros } from '@/domain/value-objects/Macros';

export type MealDetails = Macros & {
  id: string;
  name: string | null;
  status: MealStatus;
  inputType: MealInputType;
  date: string;
  time: string;
  items: MealItem[];
  pictureKey: string | null;
  createdAt: string;
};

export abstract class GetMealQuery {
  abstract execute(input: {
    userId: string;
    mealId: string;
  }): Promise<MealDetails | null>;
}
