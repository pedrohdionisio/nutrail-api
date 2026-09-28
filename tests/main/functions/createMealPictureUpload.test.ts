import { describe, expect, it } from 'vitest';
import { handler } from '@/main/functions/createMealPictureUpload';
import { errorBody, fakes, givenSignedInUser, invoke } from '../../support/app';
import { UPLOAD_URL } from '../../support/fakes/FakeFileStorage';
import { buildMeal } from '../../support/fixtures/meal';

describe('POST /meals/{mealId}/picture', () => {
  it('should return the upload signature of the registration picture', async () => {
    const user = givenSignedInUser();
    fakes().db.putMeal(buildMeal());

    expect(
      await invoke(handler, { as: user, params: { mealId: 'meal-1' } }),
    ).toEqual({
      statusCode: 200,
      body: {
        upload: {
          url: UPLOAD_URL,
          fields: {
            key: 'pictures/user-1/meal-1.jpg',
            'Content-Type': 'image/jpeg',
          },
        },
      },
    });
  });

  it('should answer 409 for a picture meal', async () => {
    const user = givenSignedInUser();
    fakes().db.putMeal(buildMeal({ inputType: 'PICTURE' }));

    expect(
      await invoke(handler, { as: user, params: { mealId: 'meal-1' } }),
    ).toEqual({
      statusCode: 409,
      body: errorBody('MEAL_PICTURE_NOT_ALLOWED'),
    });
  });

  it('should answer 404 for a meal of another user', async () => {
    const user = givenSignedInUser();
    fakes().db.putMeal(buildMeal({ userId: 'user-2' }));

    expect(
      await invoke(handler, { as: user, params: { mealId: 'meal-1' } }),
    ).toEqual({
      statusCode: 404,
      body: errorBody('MEAL_NOT_FOUND'),
    });
  });
});
