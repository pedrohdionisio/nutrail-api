import { describe, expect, it } from 'vitest';
import { SaveRecipeUseCase } from '@/application/usecases/recipes/SaveRecipeUseCase';
import { createFakes } from '../../../support/fakes/createFakes';
import { buildRecipeContent } from '../../../support/fixtures/recipe';

describe('SaveRecipeUseCase', () => {
  it('should save the accepted recipe for the user', async () => {
    const f = createFakes();

    const recipe = await new SaveRecipeUseCase(
      f.recipes,
      f.ids,
      f.clock,
    ).execute({
      userId: 'user-1',
      recipe: buildRecipeContent(),
    });

    expect(recipe).toMatchObject({
      ...buildRecipeContent(),
      id: 'id-1',
      userId: 'user-1',
      createdAt: '2026-09-26T15:00:00.000Z',
    });
    expect(f.db.recipes.has('id-1')).toBe(true);
  });
});
