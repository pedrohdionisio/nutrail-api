import { ApplicationError } from './ApplicationError';

export class RecipeNotFoundError extends ApplicationError {
  override name = 'RecipeNotFoundError';

  constructor() {
    super('Recipe not found.', 'RECIPE_NOT_FOUND', 404);
  }
}
