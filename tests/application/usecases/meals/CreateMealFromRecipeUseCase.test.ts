import { beforeEach, describe, expect, it } from 'vitest';
import { RecipeNotFoundError } from '@/application/errors/RecipeNotFoundError';
import { CreateMealFromRecipeUseCase } from '@/application/usecases/meals/CreateMealFromRecipeUseCase';
import { createFakes, type Fakes } from '../../../support/fakes/createFakes';
import { buildRecipe } from '../../../support/fixtures/recipe';

describe('CreateMealFromRecipeUseCase', () => {
  let f: Fakes;
  let createMealFromRecipe: CreateMealFromRecipeUseCase;

  beforeEach(() => {
    f = createFakes();
    createMealFromRecipe = new CreateMealFromRecipeUseCase(
      f.recipes,
      f.meals,
      f.ids,
      f.clock,
    );
  });

  it('should create an analyzed meal with one portion carrying the recipe macros', async () => {
    f.db.putRecipe(buildRecipe());

    const meal = await createMealFromRecipe.execute({
      userId: 'user-1',
      recipeId: 'recipe-1',
      date: '2026-09-26',
      time: '19:00',
      language: 'pt-BR',
    });

    expect(meal).toMatchObject({
      id: 'id-1',
      status: 'SUCCESS',
      inputType: 'MANUAL',
      name: 'Omelete de queijo com tomate',
      date: '2026-09-26',
      time: '19:00',
      createdAt: '2026-09-26T15:00:00.000Z',
    });
    expect(meal.items).toEqual([
      {
        name: 'Omelete de queijo com tomate',
        quantity: 1,
        unit: 'porção',
        calories: 420,
        protein: 30,
        carbohydrate: 6,
        fat: 30.5,
      },
    ]);
    expect(f.db.meals.has('id-1')).toBe(true);
  });

  it('should name the serving in the language of the request', async () => {
    f.db.putRecipe(buildRecipe());

    const meal = await createMealFromRecipe.execute({
      userId: 'user-1',
      recipeId: 'recipe-1',
      date: '2026-09-26',
      time: '19:00',
      language: 'en-US',
    });

    expect(meal.items[0]?.unit).toBe('serving');
    expect(meal.language).toBe('en-US');
  });

  it('should fail for a recipe of another user', async () => {
    f.db.putRecipe(buildRecipe({ userId: 'user-2' }));

    await expect(
      createMealFromRecipe.execute({
        userId: 'user-1',
        recipeId: 'recipe-1',
        date: '2026-09-26',
        time: '19:00',
        language: 'pt-BR',
      }),
    ).rejects.toThrow(RecipeNotFoundError);
    expect(f.db.meals.size).toBe(0);
  });
});
