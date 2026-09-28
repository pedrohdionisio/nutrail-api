import { beforeEach, describe, expect, it } from 'vitest';
import { MealNotFoundError } from '@/application/errors/MealNotFoundError';
import { SaveMealUseCase } from '@/application/usecases/savedMeals/SaveMealUseCase';
import { MealNotSavableError } from '@/domain/errors/MealNotSavableError';
import { createFakes, type Fakes } from '../../../support/fakes/createFakes';
import { buildMeal, buildPendingMeal } from '../../../support/fixtures/meal';

describe('SaveMealUseCase', () => {
  let f: Fakes;
  let saveMeal: SaveMealUseCase;

  beforeEach(() => {
    f = createFakes();
    saveMeal = new SaveMealUseCase(f.meals, f.savedMeals, f.ids, f.clock);
  });

  it('should save the items of an analyzed meal under the chosen name', async () => {
    f.db.putMeal(buildMeal());

    const savedMeal = await saveMeal.execute({
      userId: 'user-1',
      mealId: 'meal-1',
      name: 'Almoço de sempre',
    });

    expect(savedMeal).toMatchObject({
      id: 'id-1',
      name: 'Almoço de sempre',
      createdAt: '2026-09-26T15:00:00.000Z',
    });
    expect(f.db.savedMeals.get('id-1')?.items).toEqual(buildMeal().items);
  });

  it('should keep the saved meal independent from later edits of the meal', async () => {
    f.db.putMeal(buildMeal());
    await saveMeal.execute({
      userId: 'user-1',
      mealId: 'meal-1',
      name: 'Almoço de sempre',
    });

    f.db.meals.delete('meal-1');

    expect(f.db.savedMeals.get('id-1')?.items).toHaveLength(2);
  });

  it('should refuse a meal that is not analyzed', async () => {
    f.db.putMeal(buildPendingMeal({ status: 'FAILED' }));

    await expect(
      saveMeal.execute({ userId: 'user-1', mealId: 'meal-1', name: 'x' }),
    ).rejects.toThrow(MealNotSavableError);
    expect(f.db.savedMeals.size).toBe(0);
  });

  it('should fail for a meal of another user', async () => {
    f.db.putMeal(buildMeal({ userId: 'user-2' }));

    await expect(
      saveMeal.execute({ userId: 'user-1', mealId: 'meal-1', name: 'x' }),
    ).rejects.toThrow(MealNotFoundError);
  });
});
