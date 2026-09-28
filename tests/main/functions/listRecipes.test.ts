import { describe, expect, it } from 'vitest';
import { handler } from '@/main/functions/listRecipes';
import { fakes, givenSignedInUser, invoke } from '../../support/app';
import { buildRecipe, buildRecipeContent } from '../../support/fixtures/recipe';

describe('GET /recipes', () => {
  it('should list the recipes of the user from the newest to the oldest', async () => {
    const user = givenSignedInUser();
    fakes().db.putRecipe(
      buildRecipe({ id: 'old', createdAt: '2026-09-20T12:00:00.000Z' }),
    );
    fakes().db.putRecipe(
      buildRecipe({ id: 'new', createdAt: '2026-09-25T12:00:00.000Z' }),
    );
    fakes().db.putRecipe(buildRecipe({ id: 'other', userId: 'user-2' }));

    expect(await invoke(handler, { as: user })).toEqual({
      statusCode: 200,
      body: {
        recipes: [
          {
            ...buildRecipeContent(),
            id: 'new',
            createdAt: '2026-09-25T12:00:00.000Z',
          },
          {
            ...buildRecipeContent(),
            id: 'old',
            createdAt: '2026-09-20T12:00:00.000Z',
          },
        ],
      },
    });
  });
});
