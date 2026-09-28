import { describe, expect, it } from 'vitest';
import { handler } from '@/main/functions/createMealFromSavedMeal';
import {
  errorBody,
  fakes,
  givenSignedInUser,
  invoke,
  validationErrorBody,
} from '../../support/app';
import { buildSavedMeal } from '../../support/fixtures/savedMeal';

describe('POST /saved-meals/{savedMealId}/meal', () => {
  it('should register the saved meal on the chosen day', async () => {
    const user = givenSignedInUser();
    const savedMeal = buildSavedMeal();
    fakes().db.putSavedMeal(savedMeal);

    expect(
      await invoke(handler, {
        as: user,
        params: { savedMealId: 'saved-1' },
        body: { date: '2026-09-26', time: '12:00' },
      }),
    ).toEqual({
      statusCode: 201,
      body: {
        id: 'id-1',
        name: 'Almoço de sempre',
        status: 'SUCCESS',
        inputType: 'MANUAL',
        date: '2026-09-26',
        time: '12:00',
        items: savedMeal.items,
        ...savedMeal.totals,
        createdAt: '2026-09-26T15:00:00.000Z',
      },
    });
    expect(fakes().db.meals.get('id-1')?.date).toBe('2026-09-26');
  });

  it('should answer 404 for an unknown saved meal', async () => {
    const user = givenSignedInUser();

    expect(
      await invoke(handler, {
        as: user,
        params: { savedMealId: 'saved-1' },
        body: { date: '2026-09-26', time: '12:00' },
      }),
    ).toEqual({ statusCode: 404, body: errorBody('SAVED_MEAL_NOT_FOUND') });
  });

  it('should validate the date and time', async () => {
    const user = givenSignedInUser();

    expect(
      await invoke(handler, {
        as: user,
        params: { savedMealId: 'saved-1' },
        body: { date: '2026-13-01', time: '12h' },
      }),
    ).toEqual({ statusCode: 400, body: validationErrorBody('date', 'time') });
  });
});
