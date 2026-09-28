import { describe, expect, it } from 'vitest';
import { RecipeNotFoundError } from '@/application/errors/RecipeNotFoundError';
import { DeleteRecipeUseCase } from '@/application/usecases/recipes/DeleteRecipeUseCase';
import { createFakes } from '../../../support/fakes/createFakes';
import { buildRecipe } from '../../../support/fixtures/recipe';

describe('DeleteRecipeUseCase', () => {
  it('should delete the recipe', async () => {
    const f = createFakes();
    f.db.putRecipe(buildRecipe());

    await new DeleteRecipeUseCase(f.recipes).execute({
      userId: 'user-1',
      recipeId: 'recipe-1',
    });

    expect(f.db.recipes.size).toBe(0);
  });

  it('should fail for a recipe that does not exist or belongs to another user', async () => {
    const f = createFakes();
    f.db.putRecipe(buildRecipe({ userId: 'user-2' }));

    await expect(
      new DeleteRecipeUseCase(f.recipes).execute({
        userId: 'user-1',
        recipeId: 'recipe-1',
      }),
    ).rejects.toThrow(RecipeNotFoundError);
    expect(f.db.recipes.size).toBe(1);
  });
});
