import { ApplicationError } from './ApplicationError';

export class InvalidCodeError extends ApplicationError {
  override name = 'InvalidCodeError';

  constructor() {
    super('Invalid or expired code.', 'INVALID_CODE', 400);
  }
}
