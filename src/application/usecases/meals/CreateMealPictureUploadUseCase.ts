import { MealNotFoundError } from '@/application/errors/MealNotFoundError';
import { MealPictureNotAllowedError } from '@/application/errors/MealPictureNotAllowedError';
import {
  FileStorage,
  type UploadSignature,
} from '@/application/ports/FileStorage';
import { MealRepository } from '@/application/ports/MealRepository';
import {
  MAX_MEAL_FILE_SIZE_BYTES,
  MEAL_FILES,
  mealFileKey,
} from '@/application/services/mealFiles';
import { Injectable } from '@/kernel/decorators/Injectable';

type Input = {
  userId: string;
  mealId: string;
};

@Injectable()
export class CreateMealPictureUploadUseCase {
  constructor(
    private readonly meals: MealRepository,
    private readonly storage: FileStorage,
  ) {}

  async execute({ userId, mealId }: Input): Promise<UploadSignature> {
    const meal = await this.meals.findById(userId, mealId);

    if (!meal) {
      throw new MealNotFoundError();
    }

    if (meal.inputType === 'PICTURE') {
      throw new MealPictureNotAllowedError(
        'The picture of this meal is its input and cannot be replaced.',
      );
    }

    if (!meal.isFinished) {
      throw new MealPictureNotAllowedError(
        'The meal is still being processed.',
      );
    }

    return this.storage.createUpload({
      key: mealFileKey('PICTURE', userId, mealId),
      contentType: MEAL_FILES.PICTURE.contentType,
      maxSizeBytes: MAX_MEAL_FILE_SIZE_BYTES,
      metadata: { userid: userId, mealid: mealId },
    });
  }
}
