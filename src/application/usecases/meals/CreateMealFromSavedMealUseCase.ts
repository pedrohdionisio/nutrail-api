import { SavedMealNotFoundError } from '@/application/errors/SavedMealNotFoundError';
import { Clock } from '@/application/ports/Clock';
import { IdGenerator } from '@/application/ports/IdGenerator';
import { MealRepository } from '@/application/ports/MealRepository';
import { SavedMealRepository } from '@/application/ports/SavedMealRepository';
import type { Meal } from '@/domain/entities/Meal';
import { Injectable } from '@/kernel/decorators/Injectable';

type Input = {
  userId: string;
  savedMealId: string;
  date: string;
  time: string;
};

@Injectable()
export class CreateMealFromSavedMealUseCase {
  constructor(
    private readonly savedMeals: SavedMealRepository,
    private readonly meals: MealRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute({ userId, savedMealId, date, time }: Input): Promise<Meal> {
    const savedMeal = await this.savedMeals.findById(userId, savedMealId);

    if (!savedMeal) {
      throw new SavedMealNotFoundError();
    }

    const meal = savedMeal.toMeal({
      id: this.ids.generate(),
      date,
      time,
      createdAt: this.clock.now().toISOString(),
    });

    await this.meals.create(meal);

    return meal;
  }
}
