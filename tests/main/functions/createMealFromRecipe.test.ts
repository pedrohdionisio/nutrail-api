import { describe, expect, it } from 'vitest';
import { handler } from '@/main/functions/createMealFromRecipe';
import {
  errorBody,
  fakes,
  givenSignedInUser,
  invoke,
  validationErrorBody,
} from '../../support/app';
import { buildRecipe } from '../../support/fixtures/recipe';

describe('POST /recipes/{recipeId}/meal', () => {
  it('should register the recipe as an analyzed meal of one portion', async () => {
    const user = givenSignedInUser();
    fakes().db.putRecipe(buildRecipe());

    const response = await invoke(handler, {
      as: user,
      params: { recipeId: 'recipe-1' },
      body: { date: '2026-09-26', time: '19:00' },
    });

    expect(response).toEqual({
      statusCode: 201,
      body: {
        id: 'id-1',
        name: 'Omelete de queijo com tomate',
        status: 'SUCCESS',
        inputType: 'MANUAL',
        date: '2026-09-26',
        time: '19:00',
        items: [
          {
            name: 'Omelete de queijo com tomate',
            quantity: 1,
            unit: 'porção',
            calories: 420,
            protein: 30,
            carbohydrate: 6,
            fat: 30.5,
          },
        ],
        calories: 420,
        protein: 30,
        carbohydrate: 6,
        fat: 30.5,
        createdAt: '2026-09-26T15:00:00.000Z',
      },
    });
  });

  it('should answer 404 for an unknown recipe', async () => {
    const user = givenSignedInUser();

    expect(
      await invoke(handler, {
        as: user,
        params: { recipeId: 'recipe-1' },
        body: { date: '2026-09-26', time: '19:00' },
      }),
    ).toEqual({ statusCode: 404, body: errorBody('RECIPE_NOT_FOUND') });
  });

  it('should validate the date and time', async () => {
    const user = givenSignedInUser();
    fakes().db.putRecipe(buildRecipe());

    expect(
      await invoke(handler, {
        as: user,
        params: { recipeId: 'recipe-1' },
        body: {},
      }),
    ).toEqual({ statusCode: 400, body: validationErrorBody('date', 'time') });
  });
});
