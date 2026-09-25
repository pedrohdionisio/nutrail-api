import { ApplicationError } from './ApplicationError';

export class NoFoodIngredientsError extends ApplicationError {
  override name = 'NoFoodIngredientsError';

  constructor() {
    super(
      'No food was identified in the description.',
      'NO_FOOD_INGREDIENTS',
      422,
    );
  }
}
