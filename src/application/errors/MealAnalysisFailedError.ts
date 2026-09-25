import { ApplicationError } from './ApplicationError';

export class MealAnalysisFailedError extends ApplicationError {
  override name = 'MealAnalysisFailedError';

  constructor() {
    super('Could not analyze the meal.', 'MEAL_ANALYSIS_FAILED', 502);
  }
}
