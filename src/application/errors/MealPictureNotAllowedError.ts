import { ApplicationError } from './ApplicationError';

export class MealPictureNotAllowedError extends ApplicationError {
  override name = 'MealPictureNotAllowedError';

  constructor(reason: string) {
    super(reason, 'MEAL_PICTURE_NOT_ALLOWED', 409);
  }
}
