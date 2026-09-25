import { ApplicationError } from './ApplicationError';

export class InvalidCredentialsError extends ApplicationError {
  override name = 'InvalidCredentialsError';

  constructor() {
    super('Invalid email or password.', 'INVALID_CREDENTIALS', 401);
  }
}
