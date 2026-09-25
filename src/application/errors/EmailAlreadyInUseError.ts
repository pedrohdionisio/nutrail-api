import { ApplicationError } from './ApplicationError';

export class EmailAlreadyInUseError extends ApplicationError {
  override name = 'EmailAlreadyInUseError';

  constructor() {
    super('Email is already in use.', 'EMAIL_ALREADY_IN_USE', 409);
  }
}
