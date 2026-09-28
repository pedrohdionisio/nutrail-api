import { describe, expect, it } from 'vitest';
import { handler } from '@/main/functions/getMeal';
import { errorBody, fakes, givenSignedInUser, invoke } from '../../support/app';
import { readUrlOf } from '../../support/fakes/FakeFileStorage';
import { buildMeal } from '../../support/fixtures/meal';

describe('GET /meals/{mealId}', () => {
  it('should return the meal with items, totals and the picture url', async () => {
    const user = givenSignedInUser();
    const meal = buildMeal({ pictureKey: 'pictures/user-1/meal-1.jpg' });
    fakes().db.putMeal(meal);

    expect(
      await invoke(handler, { as: user, params: { mealId: 'meal-1' } }),
    ).toEqual({
      statusCode: 200,
      body: {
        id: 'meal-1',
        name: 'Almoço',
        status: 'SUCCESS',
        inputType: 'MANUAL',
        date: '2026-09-26',
        time: '12:30',
        items: meal.items,
        calories: 403,
        protein: 49.6,
        carbohydrate: 34,
        fat: 5.7,
        pictureUrl: readUrlOf('pictures/user-1/meal-1.jpg'),
        createdAt: '2026-09-26T15:30:00.000Z',
      },
    });
  });

  it('should return a null picture url when the meal has no picture', async () => {
    const user = givenSignedInUser();
    fakes().db.putMeal(buildMeal());

    const response = await invoke(handler, {
      as: user,
      params: { mealId: 'meal-1' },
    });

    expect(response.body).toMatchObject({ pictureUrl: null });
  });

  it('should answer 404 for a meal of another user', async () => {
    const user = givenSignedInUser();
    fakes().db.putMeal(buildMeal({ userId: 'user-2' }));

    expect(
      await invoke(handler, { as: user, params: { mealId: 'meal-1' } }),
    ).toEqual({
      statusCode: 404,
      body: errorBody('MEAL_NOT_FOUND'),
    });
  });
});
