import { ApplicationError } from './ApplicationError';

export class InvalidInviteCodeError extends ApplicationError {
  override name = 'InvalidInviteCodeError';

  constructor() {
    super(
      'The invite code does not exist or was already used.',
      'INVALID_INVITE_CODE',
      403,
    );
  }
}
