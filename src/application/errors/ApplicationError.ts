export class ApplicationError extends Error {
  override name = 'ApplicationError';

  constructor(
    message: string,
    readonly code: string,
    readonly statusCode = 400,
  ) {
    super(message);
  }
}
