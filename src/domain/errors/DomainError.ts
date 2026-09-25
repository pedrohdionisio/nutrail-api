export class DomainError extends Error {
  override name = 'DomainError';

  constructor(
    message: string,
    readonly code: string,
    readonly statusCode = 400,
  ) {
    super(message);
  }
}
