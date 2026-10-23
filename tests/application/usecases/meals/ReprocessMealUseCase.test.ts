import { beforeEach, describe, expect, it } from 'vitest';
import { DailyLimitReachedError } from '@/application/errors/DailyLimitReachedError';
import { MealNotFoundError } from '@/application/errors/MealNotFoundError';
import { DailyQuota } from '@/application/services/DailyQuota';
import { ReprocessMealUseCase } from '@/application/usecases/meals/ReprocessMealUseCase';
import { InvalidMealTransitionError } from '@/domain/errors/InvalidMealTransitionError';
import { createFakes, type Fakes } from '../../../support/fakes/createFakes';
import { exhaustDailyLimit } from '../../../support/fakes/InMemoryUsageCounter';
import { buildPendingMeal } from '../../../support/fixtures/meal';

describe('ReprocessMealUseCase', () => {
  let f: Fakes;
  let reprocessMeal: ReprocessMealUseCase;

  beforeEach(() => {
    f = createFakes();
    reprocessMeal = new ReprocessMealUseCase(
      f.meals,
      f.queue,
      new DailyQuota(f.usage, f.subscriptions, f.clock),
    );
  });

  it('should queue a failed meal again with fresh attempts', async () => {
    f.db.putMeal(buildPendingMeal({ status: 'FAILED', attempts: 3 }));

    const meal = await reprocessMeal.execute({
      userId: 'user-1',
      mealId: 'meal-1',
    });

    expect(meal.status).toBe('QUEUED');
    expect(f.db.meals.get('meal-1')).toMatchObject({
      status: 'QUEUED',
      attempts: 0,
    });
    expect(f.queue.published).toEqual([{ userId: 'user-1', mealId: 'meal-1' }]);
  });

  it('should refuse when the daily limit was reached, keeping the meal failed', async () => {
    f.db.putMeal(buildPendingMeal({ status: 'FAILED', attempts: 3 }));
    exhaustDailyLimit(f.db, 'user-1', 'MEAL_ANALYSIS');

    await expect(
      reprocessMeal.execute({ userId: 'user-1', mealId: 'meal-1' }),
    ).rejects.toThrow(DailyLimitReachedError);
    expect(f.db.meals.get('meal-1')?.status).toBe('FAILED');
    expect(f.queue.published).toEqual([]);
  });

  it('should not count a meal that did not fail', async () => {
    f.db.putMeal(buildPendingMeal({ status: 'SUCCESS' }));

    await expect(
      reprocessMeal.execute({ userId: 'user-1', mealId: 'meal-1' }),
    ).rejects.toThrow(InvalidMealTransitionError);
    expect(f.db.usage.size).toBe(0);
  });

  it('should refuse a meal that did not fail, without publishing', async () => {
    f.db.putMeal(buildPendingMeal({ status: 'SUCCESS' }));

    await expect(
      reprocessMeal.execute({ userId: 'user-1', mealId: 'meal-1' }),
    ).rejects.toThrow(InvalidMealTransitionError);
    expect(f.queue.published).toEqual([]);
  });

  it('should fail for an unknown meal', async () => {
    await expect(
      reprocessMeal.execute({ userId: 'user-1', mealId: 'meal-1' }),
    ).rejects.toThrow(MealNotFoundError);
  });
});
