import { beforeEach, describe, expect, it } from 'vitest';
import { MealNotFoundError } from '@/application/errors/MealNotFoundError';
import { ReprocessMealUseCase } from '@/application/usecases/meals/ReprocessMealUseCase';
import { InvalidMealTransitionError } from '@/domain/errors/InvalidMealTransitionError';
import { createFakes, type Fakes } from '../../../support/fakes/createFakes';
import { buildPendingMeal } from '../../../support/fixtures/meal';

describe('ReprocessMealUseCase', () => {
  let f: Fakes;
  let reprocessMeal: ReprocessMealUseCase;

  beforeEach(() => {
    f = createFakes();
    reprocessMeal = new ReprocessMealUseCase(f.meals, f.queue);
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
