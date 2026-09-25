import { DomainError } from './DomainError';

export class MealNotEditableError extends DomainError {
  override name = 'MealNotEditableError';

  constructor() {
    super(
      'Only successfully processed meals can be edited.',
      'MEAL_NOT_EDITABLE',
      409,
    );
  }
}
