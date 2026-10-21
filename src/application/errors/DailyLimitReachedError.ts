import { ApplicationError } from './ApplicationError';

export class DailyLimitReachedError extends ApplicationError {
  override name = 'DailyLimitReachedError';

  constructor() {
    super(
      'The daily limit for this feature was reached. Try again tomorrow.',
      'DAILY_LIMIT_REACHED',
      429,
    );
  }
}
