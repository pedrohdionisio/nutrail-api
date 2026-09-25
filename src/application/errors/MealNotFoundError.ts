import { ApplicationError } from './ApplicationError';

export class MealNotFoundError extends ApplicationError {
  override name = 'MealNotFoundError';

  constructor() {
    super('Meal not found.', 'MEAL_NOT_FOUND', 404);
  }
}
