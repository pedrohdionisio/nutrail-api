import { beforeEach, describe, expect, it } from 'vitest';
import { MealNotFoundError } from '@/application/errors/MealNotFoundError';
import { MealPictureNotAllowedError } from '@/application/errors/MealPictureNotAllowedError';
import { CreateMealPictureUploadUseCase } from '@/application/usecases/meals/CreateMealPictureUploadUseCase';
import { createFakes, type Fakes } from '../../../support/fakes/createFakes';
import { buildMeal, buildPendingMeal } from '../../../support/fixtures/meal';

describe('CreateMealPictureUploadUseCase', () => {
  let f: Fakes;
  let createPictureUpload: CreateMealPictureUploadUseCase;

  beforeEach(() => {
    f = createFakes();
    createPictureUpload = new CreateMealPictureUploadUseCase(
      f.meals,
      f.storage,
    );
  });

  it.each(['SUCCESS', 'FAILED'] as const)(
    'should sign an upload for the picture of a finished (%s) manual or audio meal',
    async (status) => {
      f.db.putMeal(buildMeal({ status, inputType: 'AUDIO' }));

      const upload = await createPictureUpload.execute({
        userId: 'user-1',
        mealId: 'meal-1',
      });

      expect(upload.fields.key).toBe('pictures/user-1/meal-1.jpg');
      expect(f.storage.uploads[0]).toMatchObject({
        key: 'pictures/user-1/meal-1.jpg',
        contentType: 'image/jpeg',
        metadata: { userid: 'user-1', mealid: 'meal-1' },
      });
    },
  );

  it('should refuse replacing the picture of a picture meal', async () => {
    f.db.putMeal(buildMeal({ inputType: 'PICTURE' }));

    await expect(
      createPictureUpload.execute({ userId: 'user-1', mealId: 'meal-1' }),
    ).rejects.toThrow(MealPictureNotAllowedError);
  });

  it('should refuse a picture while the meal is still being processed', async () => {
    f.db.putMeal(
      buildPendingMeal({ status: 'PROCESSING', inputType: 'AUDIO' }),
    );

    await expect(
      createPictureUpload.execute({ userId: 'user-1', mealId: 'meal-1' }),
    ).rejects.toThrow(MealPictureNotAllowedError);
  });

  it('should fail for a meal of another user', async () => {
    f.db.putMeal(buildMeal({ userId: 'user-2' }));

    await expect(
      createPictureUpload.execute({ userId: 'user-1', mealId: 'meal-1' }),
    ).rejects.toThrow(MealNotFoundError);
  });
});
