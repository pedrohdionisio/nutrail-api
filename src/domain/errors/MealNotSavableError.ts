import { DomainError } from './DomainError';

export class MealNotSavableError extends DomainError {
  override name = 'MealNotSavableError';

  constructor() {
    super(
      'Only successfully processed meals can be saved.',
      'MEAL_NOT_SAVABLE',
      409,
    );
  }
}
