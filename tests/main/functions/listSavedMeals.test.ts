import { describe, expect, it } from 'vitest';
import { handler } from '@/main/functions/listSavedMeals';
import { fakes, givenSignedInUser, invoke } from '../../support/app';
import { buildSavedMeal } from '../../support/fixtures/savedMeal';

describe('GET /saved-meals', () => {
  it('should list the saved meals of the user from the newest, with totals', async () => {
    const user = givenSignedInUser();
    const savedMeal = buildSavedMeal();
    fakes().db.putSavedMeal(
      buildSavedMeal({ id: 'old', createdAt: '2026-09-20T12:00:00.000Z' }),
    );
    fakes().db.putSavedMeal(
      buildSavedMeal({ id: 'new', createdAt: '2026-09-25T12:00:00.000Z' }),
    );
    fakes().db.putSavedMeal(buildSavedMeal({ id: 'other', userId: 'user-2' }));

    const response = await invoke(handler, { as: user });

    expect(response).toEqual({
      statusCode: 200,
      body: {
        savedMeals: [
          {
            id: 'new',
            name: 'Almoço de sempre',
            items: savedMeal.items,
            ...savedMeal.totals,
            createdAt: '2026-09-25T12:00:00.000Z',
          },
          {
            id: 'old',
            name: 'Almoço de sempre',
            items: savedMeal.items,
            ...savedMeal.totals,
            createdAt: '2026-09-20T12:00:00.000Z',
          },
        ],
      },
    });
  });
});
