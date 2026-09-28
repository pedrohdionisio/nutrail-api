import { describe, expect, it } from 'vitest';
import { handler } from '@/main/functions/deleteMeal';
import { errorBody, fakes, givenSignedInUser, invoke } from '../../support/app';
import { buildPendingMeal } from '../../support/fixtures/meal';

describe('DELETE /meals/{mealId}', () => {
  it('should delete the meal and its files', async () => {
    const user = givenSignedInUser();
    fakes().db.putMeal(buildPendingMeal({ status: 'SUCCESS' }));
    fakes().storage.putFile('pictures/user-1/meal-1.jpg');

    expect(
      await invoke(handler, { as: user, params: { mealId: 'meal-1' } }),
    ).toEqual({
      statusCode: 204,
      body: undefined,
    });
    expect(fakes().db.meals.size).toBe(0);
    expect(fakes().storage.files.size).toBe(0);
  });

  it('should answer 404 for an unknown meal', async () => {
    const user = givenSignedInUser();

    expect(
      await invoke(handler, { as: user, params: { mealId: 'meal-1' } }),
    ).toEqual({
      statusCode: 404,
      body: errorBody('MEAL_NOT_FOUND'),
    });
  });
});
