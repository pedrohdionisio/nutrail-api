export class HttpError extends Error {
  override name = 'HttpError';

  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
