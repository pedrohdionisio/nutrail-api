import { ApplicationError } from './ApplicationError';

export class TooManyAttemptsError extends ApplicationError {
  override name = 'TooManyAttemptsError';

  constructor() {
    super('Too many attempts. Try again later.', 'TOO_MANY_ATTEMPTS', 429);
  }
}
