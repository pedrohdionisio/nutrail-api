import { beforeEach, describe, expect, it } from 'vitest';
import { MealNotFoundError } from '@/application/errors/MealNotFoundError';
import { UpdateMealUseCase } from '@/application/usecases/meals/UpdateMealUseCase';
import { MealNotEditableError } from '@/domain/errors/MealNotEditableError';
import { createFakes, type Fakes } from '../../../support/fakes/createFakes';
import {
  buildMeal,
  buildMealItem,
  buildPendingMeal,
} from '../../../support/fixtures/meal';

const ITEMS = [
  buildMealItem({
    name: 'Salada',
    calories: 50,
    protein: 2,
    carbohydrate: 8,
    fat: 1,
  }),
];

describe('UpdateMealUseCase', () => {
  let f: Fakes;
  let updateMeal: UpdateMealUseCase;

  beforeEach(() => {
    f = createFakes();
    updateMeal = new UpdateMealUseCase(f.meals);
  });

  it('should replace name and items and keep the date and time when not sent', async () => {
    f.db.putMeal(buildMeal());

    const meal = await updateMeal.execute({
      userId: 'user-1',
      mealId: 'meal-1',
      name: 'Jantar leve',
      items: ITEMS,
    });

    expect(meal.totals).toEqual({
      calories: 50,
      protein: 2,
      carbohydrate: 8,
      fat: 1,
    });
    expect(f.db.meals.get('meal-1')).toMatchObject({
      name: 'Jantar leve',
      items: ITEMS,
      date: '2026-09-26',
      time: '12:30',
    });
  });

  it('should move the meal to another day and time', async () => {
    f.db.putMeal(buildMeal());

    await updateMeal.execute({
      userId: 'user-1',
      mealId: 'meal-1',
      name: 'Jantar',
      items: ITEMS,
      date: '2026-09-25',
      time: '20:15',
    });

    expect(f.db.meals.get('meal-1')).toMatchObject({
      date: '2026-09-25',
      time: '20:15',
    });
  });

  it('should refuse a meal that is not analyzed', async () => {
    f.db.putMeal(buildPendingMeal({ status: 'PROCESSING' }));

    await expect(
      updateMeal.execute({
        userId: 'user-1',
        mealId: 'meal-1',
        name: 'Jantar',
        items: ITEMS,
      }),
    ).rejects.toThrow(MealNotEditableError);
  });

  it('should fail for an unknown meal', async () => {
    await expect(
      updateMeal.execute({
        userId: 'user-1',
        mealId: 'meal-1',
        name: 'Jantar',
        items: ITEMS,
      }),
    ).rejects.toThrow(MealNotFoundError);
  });
});
