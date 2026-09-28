import { ApplicationError } from './ApplicationError';

export class SavedMealNotFoundError extends ApplicationError {
  override name = 'SavedMealNotFoundError';

  constructor() {
    super('Saved meal not found.', 'SAVED_MEAL_NOT_FOUND', 404);
  }
}
