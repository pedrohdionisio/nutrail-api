import { describe, expect, it } from 'vitest';
import { handler } from '@/main/functions/deleteRecipe';
import { errorBody, fakes, givenSignedInUser, invoke } from '../../support/app';
import { buildRecipe } from '../../support/fixtures/recipe';

describe('DELETE /recipes/{recipeId}', () => {
  it('should delete the recipe', async () => {
    const user = givenSignedInUser();
    fakes().db.putRecipe(buildRecipe());

    expect(
      await invoke(handler, { as: user, params: { recipeId: 'recipe-1' } }),
    ).toEqual({
      statusCode: 204,
      body: undefined,
    });
    expect(fakes().db.recipes.size).toBe(0);
  });

  it('should answer 404 for a recipe that does not exist', async () => {
    const user = givenSignedInUser();

    expect(
      await invoke(handler, { as: user, params: { recipeId: 'recipe-1' } }),
    ).toEqual({
      statusCode: 404,
      body: errorBody('RECIPE_NOT_FOUND'),
    });
  });
});
