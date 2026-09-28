import { DomainError } from './DomainError';

export class GoalsBelowMacrosError extends DomainError {
  override name = 'GoalsBelowMacrosError';

  constructor() {
    super(
      'Calories are lower than the protein and fat goals require.',
      'GOALS_BELOW_MACROS',
      422,
    );
  }
}
