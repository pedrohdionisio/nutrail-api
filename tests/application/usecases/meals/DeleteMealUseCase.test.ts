import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MealNotFoundError } from '@/application/errors/MealNotFoundError';
import { DeleteMealUseCase } from '@/application/usecases/meals/DeleteMealUseCase';
import { createFakes, type Fakes } from '../../../support/fakes/createFakes';
import { buildMeal, buildPendingMeal } from '../../../support/fixtures/meal';

describe('DeleteMealUseCase', () => {
  let f: Fakes;
  let deleteMeal: DeleteMealUseCase;

  beforeEach(() => {
    f = createFakes();
    deleteMeal = new DeleteMealUseCase(f.meals, f.storage);
  });

  it('should delete the input file, the picture and the meal', async () => {
    f.db.putMeal(
      buildMeal({
        inputFileKey: 'inputs/user-1/meal-1.m4a',
        pictureKey: 'pictures/user-1/meal-1.jpg',
      }),
    );
    f.storage.putFile('inputs/user-1/meal-1.m4a');
    f.storage.putFile('pictures/user-1/meal-1.jpg');

    await deleteMeal.execute({ userId: 'user-1', mealId: 'meal-1' });

    expect(f.storage.files.size).toBe(0);
    expect(f.db.meals.size).toBe(0);
  });

  it('should delete a shared picture and input file only once', async () => {
    const deleteMany = vi.spyOn(f.storage, 'deleteMany');
    f.db.putMeal(buildPendingMeal({ status: 'SUCCESS' }));

    await deleteMeal.execute({ userId: 'user-1', mealId: 'meal-1' });

    expect(deleteMany).toHaveBeenCalledWith(['pictures/user-1/meal-1.jpg']);
  });

  it('should keep the meal when the files cannot be deleted, so the user can try again', async () => {
    f.db.putMeal(buildPendingMeal({ status: 'SUCCESS' }));
    vi.spyOn(f.storage, 'deleteMany').mockRejectedValue(
      new Error('S3 is down'),
    );

    await expect(
      deleteMeal.execute({ userId: 'user-1', mealId: 'meal-1' }),
    ).rejects.toThrow('S3 is down');
    expect(f.db.meals.has('meal-1')).toBe(true);
  });

  it('should fail for an unknown meal', async () => {
    await expect(
      deleteMeal.execute({ userId: 'user-1', mealId: 'meal-1' }),
    ).rejects.toThrow(MealNotFoundError);
  });
});
