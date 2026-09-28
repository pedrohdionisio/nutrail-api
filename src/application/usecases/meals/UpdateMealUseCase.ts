import { MealNotFoundError } from '@/application/errors/MealNotFoundError';
import { MealRepository } from '@/application/ports/MealRepository';
import type { Meal, MealItem } from '@/domain/entities/Meal';
import { Injectable } from '@/kernel/decorators/Injectable';

type Input = {
  userId: string;
  mealId: string;
  name: string;
  items: MealItem[];
  date?: string;
  time?: string;
};

@Injectable()
export class UpdateMealUseCase {
  constructor(private readonly meals: MealRepository) {}

  async execute({
    userId,
    mealId,
    name,
    items,
    date,
    time,
  }: Input): Promise<Meal> {
    const meal = await this.meals.findById(userId, mealId);

    if (!meal) {
      throw new MealNotFoundError();
    }

    meal.edit({
      name,
      items,
      date: date ?? meal.date,
      time: time ?? meal.time,
    });
    await this.meals.update(meal);

    return meal;
  }
}
