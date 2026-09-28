import { ApplicationError } from './ApplicationError';

export class InvalidCurrentPasswordError extends ApplicationError {
  override name = 'InvalidCurrentPasswordError';

  constructor() {
    super(
      'The current password is incorrect.',
      'INVALID_CURRENT_PASSWORD',
      400,
    );
  }
}
