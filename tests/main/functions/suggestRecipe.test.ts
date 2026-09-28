import { describe, expect, it } from 'vitest';
import { RecipeGenerationFailedError } from '@/application/errors/RecipeGenerationFailedError';
import { handler } from '@/main/functions/suggestRecipe';
import {
  errorBody,
  fakes,
  givenSignedInUser,
  invoke,
  validationErrorBody,
} from '../../support/app';
import { buildMeal } from '../../support/fixtures/meal';
import { buildRecipeContent } from '../../support/fixtures/recipe';

const BODY = { date: '2026-09-26', text: 'tenho 5 ovos e um pouco de queijo' };

describe('POST /recipes/suggestions', () => {
  it('should suggest a recipe for what is left of the day, without saving it', async () => {
    const user = givenSignedInUser();
    fakes().db.putMeal(buildMeal());

    expect(await invoke(handler, { as: user, body: BODY })).toEqual({
      statusCode: 200,
      body: { recipe: buildRecipeContent() },
    });
    expect(fakes().recipeGenerator.calls).toEqual([
      {
        text: BODY.text,
        goal: 'LOSE',
        remaining: {
          calories: 1397,
          protein: 70.4,
          carbohydrate: 170,
          fat: 48.3,
        },
      },
    ]);
    expect(fakes().db.recipes.size).toBe(0);
  });

  it('should answer 422 when the request has no food', async () => {
    const user = givenSignedInUser();
    fakes().recipeGenerator.recipe = buildRecipeContent({ ingredients: [] });

    expect(await invoke(handler, { as: user, body: BODY })).toEqual({
      statusCode: 422,
      body: errorBody('NO_FOOD_INGREDIENTS'),
    });
  });

  it('should answer 502 when the generation fails', async () => {
    const user = givenSignedInUser();
    fakes().recipeGenerator.error = new RecipeGenerationFailedError();

    expect(await invoke(handler, { as: user, body: BODY })).toEqual({
      statusCode: 502,
      body: errorBody('RECIPE_GENERATION_FAILED'),
    });
  });

  it('should validate the date and the text', async () => {
    const user = givenSignedInUser();

    expect(
      await invoke(handler, { as: user, body: { date: 'hoje', text: '' } }),
    ).toEqual({
      statusCode: 400,
      body: validationErrorBody('date', 'text'),
    });
  });
});
