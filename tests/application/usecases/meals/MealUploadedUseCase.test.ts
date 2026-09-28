import { beforeEach, describe, expect, it } from 'vitest';
import { MealUploadedUseCase } from '@/application/usecases/meals/MealUploadedUseCase';
import { createFakes, type Fakes } from '../../../support/fakes/createFakes';
import { buildMeal, buildPendingMeal } from '../../../support/fixtures/meal';

const METADATA = { userid: 'user-1', mealid: 'meal-1' };

describe('MealUploadedUseCase', () => {
  let f: Fakes;
  let mealUploaded: MealUploadedUseCase;

  beforeEach(() => {
    f = createFakes();
    mealUploaded = new MealUploadedUseCase(f.meals, f.storage, f.queue);
  });

  it('should queue the meal when its input file arrives', async () => {
    f.db.putMeal(buildPendingMeal());
    f.storage.putFile('pictures/user-1/meal-1.jpg', METADATA);

    await mealUploaded.execute('pictures/user-1/meal-1.jpg');

    expect(f.db.meals.get('meal-1')?.status).toBe('QUEUED');
    expect(f.queue.published).toEqual([{ userId: 'user-1', mealId: 'meal-1' }]);
  });

  it('should publish again a meal that is already queued, without changing it', async () => {
    f.db.putMeal(buildPendingMeal({ status: 'QUEUED' }));
    f.storage.putFile('pictures/user-1/meal-1.jpg', METADATA);

    await mealUploaded.execute('pictures/user-1/meal-1.jpg');

    expect(f.queue.published).toHaveLength(1);
  });

  it('should ignore an input file of a meal already processing or finished', async () => {
    f.db.putMeal(buildPendingMeal({ status: 'PROCESSING' }));
    f.storage.putFile('pictures/user-1/meal-1.jpg', METADATA);

    await mealUploaded.execute('pictures/user-1/meal-1.jpg');

    expect(f.db.meals.get('meal-1')?.status).toBe('PROCESSING');
    expect(f.queue.published).toEqual([]);
  });

  it('should attach the registration picture of a finished audio or manual meal', async () => {
    f.db.putMeal(
      buildMeal({
        inputType: 'AUDIO',
        inputFileKey: 'inputs/user-1/meal-1.m4a',
      }),
    );
    f.storage.putFile('pictures/user-1/meal-1.jpg', METADATA);

    await mealUploaded.execute('pictures/user-1/meal-1.jpg');

    expect(f.db.meals.get('meal-1')?.pictureKey).toBe(
      'pictures/user-1/meal-1.jpg',
    );
    expect(f.queue.published).toEqual([]);
  });

  it('should not attach a picture while the meal is not finished', async () => {
    f.db.putMeal(
      buildPendingMeal({
        status: 'PROCESSING',
        inputType: 'AUDIO',
        inputFileKey: 'inputs/user-1/meal-1.m4a',
        pictureKey: null,
      }),
    );
    f.storage.putFile('pictures/user-1/meal-1.jpg', METADATA);

    await mealUploaded.execute('pictures/user-1/meal-1.jpg');

    expect(f.db.meals.get('meal-1')?.pictureKey).toBeNull();
  });

  it('should ignore files without metadata or of meals that no longer exist', async () => {
    f.storage.putFile('pictures/user-1/meal-1.jpg', {});
    f.storage.putFile('pictures/user-1/meal-2.jpg', {
      userid: 'user-1',
      mealid: 'meal-2',
    });

    await mealUploaded.execute('pictures/user-1/meal-1.jpg');
    await mealUploaded.execute('pictures/user-1/meal-2.jpg');

    expect(f.queue.published).toEqual([]);
  });

  it('should ignore an unrelated file of an existing meal', async () => {
    f.db.putMeal(
      buildMeal({
        inputType: 'AUDIO',
        inputFileKey: 'inputs/user-1/meal-1.m4a',
      }),
    );
    f.storage.putFile('other/user-1/meal-1.jpg', METADATA);

    await mealUploaded.execute('other/user-1/meal-1.jpg');

    expect(f.db.meals.get('meal-1')?.pictureKey).toBeNull();
  });
});
