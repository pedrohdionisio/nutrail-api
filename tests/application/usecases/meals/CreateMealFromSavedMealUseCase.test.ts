import { beforeEach, describe, expect, it } from 'vitest';
import { SavedMealNotFoundError } from '@/application/errors/SavedMealNotFoundError';
import { CreateMealFromSavedMealUseCase } from '@/application/usecases/meals/CreateMealFromSavedMealUseCase';
import { createFakes, type Fakes } from '../../../support/fakes/createFakes';
import { buildSavedMeal } from '../../../support/fixtures/savedMeal';

describe('CreateMealFromSavedMealUseCase', () => {
  let f: Fakes;
  let createMealFromSavedMeal: CreateMealFromSavedMealUseCase;

  beforeEach(() => {
    f = createFakes();
    createMealFromSavedMeal = new CreateMealFromSavedMealUseCase(
      f.savedMeals,
      f.meals,
      f.ids,
      f.clock,
    );
  });

  it('should create an analyzed meal with the name and items of the saved meal', async () => {
    f.db.putSavedMeal(buildSavedMeal());

    const meal = await createMealFromSavedMeal.execute({
      userId: 'user-1',
      savedMealId: 'saved-1',
      date: '2026-09-26',
      time: '12:00',
      language: 'pt-BR',
    });

    expect(meal).toMatchObject({
      id: 'id-1',
      status: 'SUCCESS',
      inputType: 'MANUAL',
      name: 'Almoço de sempre',
      date: '2026-09-26',
      time: '12:00',
    });
    expect(f.db.meals.get('id-1')?.items).toEqual(buildSavedMeal().items);
    expect(f.db.savedMeals.has('saved-1')).toBe(true);
  });

  it('should fail for a saved meal of another user', async () => {
    f.db.putSavedMeal(buildSavedMeal({ userId: 'user-2' }));

    await expect(
      createMealFromSavedMeal.execute({
        userId: 'user-1',
        savedMealId: 'saved-1',
        date: '2026-09-26',
        time: '12:00',
        language: 'pt-BR',
      }),
    ).rejects.toThrow(SavedMealNotFoundError);
  });
});
