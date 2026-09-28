import { describe, expect, it } from 'vitest';
import { buildSavedMeal } from '../../support/fixtures/savedMeal';

describe('SavedMeal', () => {
  it('should derive the totals from the items', () => {
    expect(buildSavedMeal().totals).toEqual({
      calories: 403,
      protein: 49.6,
      carbohydrate: 34,
      fat: 5.7,
    });
  });

  it('should become an analyzed manual meal on the chosen day, without files', () => {
    const savedMeal = buildSavedMeal();

    const meal = savedMeal.toMeal({
      id: 'meal-9',
      date: '2026-09-27',
      time: '12:00',
      createdAt: '2026-09-27T15:00:00.000Z',
    });

    expect(meal).toMatchObject({
      id: 'meal-9',
      userId: 'user-1',
      status: 'SUCCESS',
      inputType: 'MANUAL',
      inputFileKey: null,
      inputText: null,
      pictureKey: null,
      name: 'Almoço de sempre',
      attempts: 0,
      date: '2026-09-27',
      time: '12:00',
      createdAt: '2026-09-27T15:00:00.000Z',
    });
    expect(meal.items).toEqual(savedMeal.items);
    expect(meal.items[0]).not.toBe(savedMeal.items[0]);
    expect(meal.totals).toEqual(savedMeal.totals);
  });
});
