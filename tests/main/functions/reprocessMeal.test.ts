import { describe, expect, it } from 'vitest';
import { handler } from '@/main/functions/reprocessMeal';
import { errorBody, fakes, givenSignedInUser, invoke } from '../../support/app';
import { buildMeal, buildPendingMeal } from '../../support/fixtures/meal';

describe('POST /meals/{mealId}/reprocess', () => {
  it('should queue the failed meal again and answer 202', async () => {
    const user = givenSignedInUser();
    fakes().db.putMeal(buildPendingMeal({ status: 'FAILED', attempts: 3 }));

    expect(
      await invoke(handler, { as: user, params: { mealId: 'meal-1' } }),
    ).toEqual({
      statusCode: 202,
      body: { id: 'meal-1', status: 'QUEUED' },
    });
    expect(fakes().queue.published).toEqual([
      { userId: 'user-1', mealId: 'meal-1' },
    ]);
  });

  it('should answer 409 for a manual meal', async () => {
    const user = givenSignedInUser();
    fakes().db.putMeal(buildMeal({ status: 'FAILED' }));

    expect(
      await invoke(handler, { as: user, params: { mealId: 'meal-1' } }),
    ).toEqual({
      statusCode: 409,
      body: errorBody('INVALID_MEAL_TRANSITION'),
    });
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
