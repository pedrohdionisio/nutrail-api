import { DomainError } from './DomainError';

export class InvalidMealTransitionError extends DomainError {
  override name = 'InvalidMealTransitionError';

  constructor(from: string, to: string) {
    super(
      `Meal cannot go from ${from} to ${to}.`,
      'INVALID_MEAL_TRANSITION',
      409,
    );
  }
}
