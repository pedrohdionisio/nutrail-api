import { MealNotFoundError } from '@/application/errors/MealNotFoundError';
import { Clock } from '@/application/ports/Clock';
import { IdGenerator } from '@/application/ports/IdGenerator';
import { MealRepository } from '@/application/ports/MealRepository';
import { SavedMealRepository } from '@/application/ports/SavedMealRepository';
import type { SavedMeal } from '@/domain/entities/SavedMeal';
import { Injectable } from '@/kernel/decorators/Injectable';

type Input = {
  userId: string;
  mealId: string;
  name: string;
};

@Injectable()
export class SaveMealUseCase {
  constructor(
    private readonly meals: MealRepository,
    private readonly savedMeals: SavedMealRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute({ userId, mealId, name }: Input): Promise<SavedMeal> {
    const meal = await this.meals.findById(userId, mealId);

    if (!meal) {
      throw new MealNotFoundError();
    }

    const savedMeal = meal.saveAs({
      id: this.ids.generate(),
      name,
      createdAt: this.clock.now().toISOString(),
    });

    await this.savedMeals.create(savedMeal);

    return savedMeal;
  }
}
