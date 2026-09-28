import { describe, expect, it } from 'vitest';
import { handler } from '@/main/functions/mealUploaded';
import { fakes, s3Event } from '../../support/app';
import { buildMeal, buildPendingMeal } from '../../support/fixtures/meal';

describe('meal file uploaded (S3 via EventBridge)', () => {
  it('should queue the meal when its input file arrives', async () => {
    fakes().db.putMeal(buildPendingMeal());
    fakes().storage.putFile('pictures/user-1/meal-1.jpg', {
      userid: 'user-1',
      mealid: 'meal-1',
    });

    await handler(s3Event('pictures/user-1/meal-1.jpg'));

    expect(fakes().db.meals.get('meal-1')?.status).toBe('QUEUED');
    expect(fakes().queue.published).toEqual([
      { userId: 'user-1', mealId: 'meal-1' },
    ]);
  });

  it('should attach a registration picture to a finished meal', async () => {
    fakes().db.putMeal(buildMeal());
    fakes().storage.putFile('pictures/user-1/meal-1.jpg', {
      userid: 'user-1',
      mealid: 'meal-1',
    });

    await handler(s3Event('pictures/user-1/meal-1.jpg'));

    expect(fakes().db.meals.get('meal-1')?.pictureKey).toBe(
      'pictures/user-1/meal-1.jpg',
    );
  });
});
