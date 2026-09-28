import { describe, expect, it } from 'vitest';
import { handler } from '@/main/functions/deleteSavedMeal';
import { errorBody, fakes, givenSignedInUser, invoke } from '../../support/app';
import { buildSavedMeal } from '../../support/fixtures/savedMeal';

describe('DELETE /saved-meals/{savedMealId}', () => {
  it('should delete the saved meal', async () => {
    const user = givenSignedInUser();
    fakes().db.putSavedMeal(buildSavedMeal());

    expect(
      await invoke(handler, { as: user, params: { savedMealId: 'saved-1' } }),
    ).toEqual({
      statusCode: 204,
      body: undefined,
    });
    expect(fakes().db.savedMeals.size).toBe(0);
  });

  it('should answer 404 for a saved meal that does not exist', async () => {
    const user = givenSignedInUser();

    expect(
      await invoke(handler, { as: user, params: { savedMealId: 'saved-1' } }),
    ).toEqual({
      statusCode: 404,
      body: errorBody('SAVED_MEAL_NOT_FOUND'),
    });
  });
});
