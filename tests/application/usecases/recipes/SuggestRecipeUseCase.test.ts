import { beforeEach, describe, expect, it } from 'vitest';
import { NoFoodIngredientsError } from '@/application/errors/NoFoodIngredientsError';
import { UserNotFoundError } from '@/application/errors/UserNotFoundError';
import { SuggestRecipeUseCase } from '@/application/usecases/recipes/SuggestRecipeUseCase';
import { createFakes, type Fakes } from '../../../support/fakes/createFakes';
import {
  buildMeal,
  buildMealItem,
  buildPendingMeal,
} from '../../../support/fixtures/meal';
import { buildRecipeContent } from '../../../support/fixtures/recipe';
import { buildUser } from '../../../support/fixtures/user';

describe('SuggestRecipeUseCase', () => {
  let f: Fakes;
  let suggestRecipe: SuggestRecipeUseCase;

  beforeEach(() => {
    f = createFakes();
    suggestRecipe = new SuggestRecipeUseCase(
      f.getProfile,
      f.listMealsByDay,
      f.recipeGenerator,
    );
    f.db.putUser(
      buildUser({
        goal: 'GAIN',
        goals: { calories: 2000, protein: 150, carbohydrate: 200, fat: 60 },
      }),
    );
  });

  it('should ask for a recipe with the goal and what is left of the day', async () => {
    f.db.putMeal(
      buildMeal({
        items: [
          buildMealItem({
            calories: 500,
            protein: 40.2,
            carbohydrate: 50,
            fat: 20,
          }),
        ],
      }),
    );

    const recipe = await suggestRecipe.execute({
      userId: 'user-1',
      date: '2026-09-26',
      text: 'tenho ovos e queijo',
    });

    expect(recipe).toEqual(buildRecipeContent());
    expect(f.recipeGenerator.calls).toEqual([
      {
        text: 'tenho ovos e queijo',
        goal: 'GAIN',
        remaining: {
          calories: 1500,
          protein: 109.8,
          carbohydrate: 150,
          fat: 40,
        },
      },
    ]);
  });

  it('should count only analyzed meals of that day and never go below zero', async () => {
    f.db.putMeal(
      buildMeal({
        items: [
          buildMealItem({
            calories: 2500,
            protein: 10,
            carbohydrate: 10,
            fat: 70,
          }),
        ],
      }),
    );
    f.db.putMeal(buildPendingMeal({ id: 'meal-2', status: 'PROCESSING' }));
    f.db.putMeal(buildMeal({ id: 'meal-3', date: '2026-09-25' }));

    await suggestRecipe.execute({
      userId: 'user-1',
      date: '2026-09-26',
      text: 'ovos',
    });

    expect(f.recipeGenerator.calls[0]?.remaining).toEqual({
      calories: 0,
      protein: 140,
      carbohydrate: 190,
      fat: 0,
    });
  });

  it('should refuse a request without food', async () => {
    f.recipeGenerator.recipe = buildRecipeContent({ ingredients: [] });

    await expect(
      suggestRecipe.execute({
        userId: 'user-1',
        date: '2026-09-26',
        text: 'uma cadeira',
      }),
    ).rejects.toThrow(NoFoodIngredientsError);
  });

  it('should fail for an unknown user without calling the generator', async () => {
    await expect(
      suggestRecipe.execute({
        userId: 'nobody',
        date: '2026-09-26',
        text: 'ovos',
      }),
    ).rejects.toThrow(UserNotFoundError);
    expect(f.recipeGenerator.calls).toEqual([]);
  });
});
