import { DomainError } from './DomainError';

export class MealWithoutItemsError extends DomainError {
  override name = 'MealWithoutItemsError';

  constructor() {
    super('No food was identified in the meal.', 'MEAL_WITHOUT_ITEMS', 422);
  }
}
