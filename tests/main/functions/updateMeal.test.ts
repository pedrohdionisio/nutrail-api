import { describe, expect, it } from 'vitest';
import { handler } from '@/main/functions/updateMeal';
import {
  errorBody,
  fakes,
  givenSignedInUser,
  invoke,
  validationErrorBody,
} from '../../support/app';
import {
  buildMeal,
  buildMealItem,
  buildPendingMeal,
} from '../../support/fixtures/meal';

const ITEMS = [
  buildMealItem({
    name: 'Salada',
    calories: 50,
    protein: 2,
    carbohydrate: 8,
    fat: 1,
  }),
];

describe('PUT /meals/{mealId}', () => {
  it('should save the edition and return the meal with recalculated totals', async () => {
    const user = givenSignedInUser();
    fakes().db.putMeal(buildMeal());

    const response = await invoke(handler, {
      as: user,
      params: { mealId: 'meal-1' },
      body: {
        name: 'Jantar leve',
        items: ITEMS,
        date: '2026-09-25',
        time: '20:00',
      },
    });

    expect(response).toEqual({
      statusCode: 200,
      body: {
        name: 'Jantar leve',
        items: ITEMS,
        date: '2026-09-25',
        time: '20:00',
        calories: 50,
        protein: 2,
        carbohydrate: 8,
        fat: 1,
      },
    });
    expect(fakes().db.meals.get('meal-1')).toMatchObject({
      name: 'Jantar leve',
      date: '2026-09-25',
    });
  });

  it('should answer 409 for a meal that is not analyzed', async () => {
    const user = givenSignedInUser();
    fakes().db.putMeal(buildPendingMeal({ status: 'FAILED' }));

    expect(
      await invoke(handler, {
        as: user,
        params: { mealId: 'meal-1' },
        body: { name: 'x', items: ITEMS },
      }),
    ).toEqual({ statusCode: 409, body: errorBody('MEAL_NOT_EDITABLE') });
  });

  it('should answer 404 for an unknown meal', async () => {
    const user = givenSignedInUser();

    expect(
      await invoke(handler, {
        as: user,
        params: { mealId: 'meal-1' },
        body: { name: 'x', items: ITEMS },
      }),
    ).toEqual({ statusCode: 404, body: errorBody('MEAL_NOT_FOUND') });
  });

  it('should refuse an edition without items or with invalid macros', async () => {
    const user = givenSignedInUser();
    fakes().db.putMeal(buildMeal());

    expect(
      await invoke(handler, {
        as: user,
        params: { mealId: 'meal-1' },
        body: { name: 'x', items: [] },
      }),
    ).toEqual({ statusCode: 400, body: validationErrorBody('items') });
    expect(
      await invoke(handler, {
        as: user,
        params: { mealId: 'meal-1' },
        body: {
          name: 'x',
          items: [{ ...ITEMS[0], calories: 10.5, quantity: 0 }],
        },
      }),
    ).toEqual({
      statusCode: 400,
      body: validationErrorBody('items.0.calories', 'items.0.quantity'),
    });
  });
});
