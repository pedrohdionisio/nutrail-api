import { describe, expect, it } from 'vitest';
import { handler } from '@/main/functions/analyzeMealItems';
import {
  errorBody,
  fakes,
  givenSignedInUser,
  invoke,
  validationErrorBody,
} from '../../support/app';
import { buildMealItem } from '../../support/fixtures/meal';

describe('POST /meals/items/analysis', () => {
  it('should return the analyzed items without saving anything', async () => {
    const user = givenSignedInUser();
    const items = [
      buildMealItem({ name: 'Azeite', quantity: 2, unit: 'colheres de sopa' }),
    ];
    fakes().analyzer.items = items;

    expect(
      await invoke(handler, {
        as: user,
        body: { text: '2 colheres de sopa de azeite' },
      }),
    ).toEqual({ statusCode: 200, body: { items } });
    expect(fakes().db.meals.size).toBe(0);
  });

  it('should answer 422 when no food is identified', async () => {
    const user = givenSignedInUser();
    fakes().analyzer.items = [];

    expect(
      await invoke(handler, { as: user, body: { text: 'uma cadeira' } }),
    ).toEqual({
      statusCode: 422,
      body: errorBody('MEAL_WITHOUT_ITEMS'),
    });
  });

  it('should limit the text to 500 characters', async () => {
    const user = givenSignedInUser();

    expect(
      await invoke(handler, { as: user, body: { text: 'a'.repeat(501) } }),
    ).toEqual({
      statusCode: 400,
      body: validationErrorBody('text'),
    });
  });
});
