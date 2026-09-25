import { ApplicationError } from './ApplicationError';

export class InvalidRefreshTokenError extends ApplicationError {
  override name = 'InvalidRefreshTokenError';

  constructor() {
    super('Invalid or expired refresh token.', 'INVALID_REFRESH_TOKEN', 401);
  }
}
