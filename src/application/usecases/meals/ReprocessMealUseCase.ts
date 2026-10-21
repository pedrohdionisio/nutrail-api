import { MealNotFoundError } from '@/application/errors/MealNotFoundError';
import { MealProcessingQueue } from '@/application/ports/MealProcessingQueue';
import { MealRepository } from '@/application/ports/MealRepository';
import { DailyQuota } from '@/application/services/DailyQuota';
import type { Meal } from '@/domain/entities/Meal';
import { Injectable } from '@/kernel/decorators/Injectable';

type Input = {
  userId: string;
  mealId: string;
};

@Injectable()
export class ReprocessMealUseCase {
  constructor(
    private readonly meals: MealRepository,
    private readonly queue: MealProcessingQueue,
    private readonly quota: DailyQuota,
  ) {}

  async execute({ userId, mealId }: Input): Promise<Meal> {
    const meal = await this.meals.findById(userId, mealId);

    if (!meal) {
      throw new MealNotFoundError();
    }

    meal.retry();
    await this.quota.consume(userId, 'MEAL_ANALYSIS');
    await this.meals.update(meal);
    await this.queue.publish({ userId, mealId });

    return meal;
  }
}
