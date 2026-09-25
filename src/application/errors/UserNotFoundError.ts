import { ApplicationError } from './ApplicationError';

export class UserNotFoundError extends ApplicationError {
  override name = 'UserNotFoundError';

  constructor() {
    super('User not found.', 'USER_NOT_FOUND', 404);
  }
}
