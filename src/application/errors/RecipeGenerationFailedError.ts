import { ApplicationError } from './ApplicationError';

export class RecipeGenerationFailedError extends ApplicationError {
  override name = 'RecipeGenerationFailedError';

  constructor() {
    super('Could not generate a recipe.', 'RECIPE_GENERATION_FAILED', 502);
  }
}
