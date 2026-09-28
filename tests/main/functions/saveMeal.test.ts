import { describe, expect, it } from 'vitest';
import { handler } from '@/main/functions/saveMeal';
import {
  errorBody,
  fakes,
  givenSignedInUser,
  invoke,
  validationErrorBody,
} from '../../support/app';
import { buildMeal, buildPendingMeal } from '../../support/fixtures/meal';

describe('POST /saved-meals', () => {
  it('should save an analyzed meal under the chosen name', async () => {
    const user = givenSignedInUser();
    const meal = buildMeal();
    fakes().db.putMeal(meal);

    expect(
      await invoke(handler, {
        as: user,
        body: { mealId: 'meal-1', name: '  Almoço de sempre ' },
      }),
    ).toEqual({
      statusCode: 201,
      body: {
        id: 'id-1',
        name: 'Almoço de sempre',
        items: meal.items,
        calories: 403,
        protein: 49.6,
        carbohydrate: 34,
        fat: 5.7,
        createdAt: '2026-09-26T15:00:00.000Z',
      },
    });
  });

  it('should answer 409 for a meal that is not analyzed', async () => {
    const user = givenSignedInUser();
    fakes().db.putMeal(buildPendingMeal({ status: 'PROCESSING' }));

    expect(
      await invoke(handler, {
        as: user,
        body: { mealId: 'meal-1', name: 'Almoço' },
      }),
    ).toEqual({ statusCode: 409, body: errorBody('MEAL_NOT_SAVABLE') });
  });

  it('should answer 404 for a meal of another user', async () => {
    const user = givenSignedInUser();
    fakes().db.putMeal(buildMeal({ userId: 'user-2' }));

    expect(
      await invoke(handler, {
        as: user,
        body: { mealId: 'meal-1', name: 'Almoço' },
      }),
    ).toEqual({ statusCode: 404, body: errorBody('MEAL_NOT_FOUND') });
  });

  it('should require a name of up to 60 characters', async () => {
    const user = givenSignedInUser();

    expect(
      await invoke(handler, {
        as: user,
        body: { mealId: 'meal-1', name: 'a'.repeat(61) },
      }),
    ).toEqual({ statusCode: 400, body: validationErrorBody('name') });
    expect(
      await invoke(handler, { as: user, body: { mealId: '', name: '' } }),
    ).toEqual({
      statusCode: 400,
      body: validationErrorBody('mealId', 'name'),
    });
  });
});
