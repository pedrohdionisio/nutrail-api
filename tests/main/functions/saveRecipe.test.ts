import { describe, expect, it } from 'vitest';
import { handler } from '@/main/functions/saveRecipe';
import {
  fakes,
  givenSignedInUser,
  invoke,
  validationErrorBody,
} from '../../support/app';
import { buildRecipeContent } from '../../support/fixtures/recipe';

describe('POST /recipes', () => {
  it('should save the recipe and return it', async () => {
    const user = givenSignedInUser();

    expect(
      await invoke(handler, { as: user, body: buildRecipeContent() }),
    ).toEqual({
      statusCode: 201,
      body: {
        ...buildRecipeContent(),
        id: 'id-1',
        createdAt: '2026-09-26T15:00:00.000Z',
      },
    });
    expect(fakes().db.recipes.get('id-1')?.userId).toBe('user-1');
  });

  it('should validate the recipe', async () => {
    const user = givenSignedInUser();

    expect(
      await invoke(handler, {
        as: user,
        body: {
          ...buildRecipeContent(),
          ingredients: [],
          calories: -1,
          instructions: '',
        },
      }),
    ).toEqual({
      statusCode: 400,
      body: validationErrorBody('ingredients', 'calories', 'instructions'),
    });
  });
});
