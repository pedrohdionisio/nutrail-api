import { describe, expect, it } from 'vitest';
import { SavedMealNotFoundError } from '@/application/errors/SavedMealNotFoundError';
import { DeleteSavedMealUseCase } from '@/application/usecases/savedMeals/DeleteSavedMealUseCase';
import { createFakes } from '../../../support/fakes/createFakes';
import { buildSavedMeal } from '../../../support/fixtures/savedMeal';

describe('DeleteSavedMealUseCase', () => {
  it('should delete the saved meal', async () => {
    const f = createFakes();
    f.db.putSavedMeal(buildSavedMeal());

    await new DeleteSavedMealUseCase(f.savedMeals).execute({
      userId: 'user-1',
      savedMealId: 'saved-1',
    });

    expect(f.db.savedMeals.size).toBe(0);
  });

  it('should fail for a saved meal that does not exist or belongs to another user', async () => {
    const f = createFakes();
    f.db.putSavedMeal(buildSavedMeal({ userId: 'user-2' }));

    await expect(
      new DeleteSavedMealUseCase(f.savedMeals).execute({
        userId: 'user-1',
        savedMealId: 'saved-1',
      }),
    ).rejects.toThrow(SavedMealNotFoundError);
    expect(f.db.savedMeals.size).toBe(1);
  });
});
