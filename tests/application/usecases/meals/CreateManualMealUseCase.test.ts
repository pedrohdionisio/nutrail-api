import { beforeEach, describe, expect, it } from 'vitest';
import { MealAnalysisFailedError } from '@/application/errors/MealAnalysisFailedError';
import { CreateManualMealUseCase } from '@/application/usecases/meals/CreateManualMealUseCase';
import { MealWithoutItemsError } from '@/domain/errors/MealWithoutItemsError';
import { createFakes, type Fakes } from '../../../support/fakes/createFakes';
import { buildMealAnalysis } from '../../../support/fixtures/meal';

const INPUT = {
  userId: 'user-1',
  date: '2026-09-26',
  time: '12:30',
  text: '120 g de arroz e 150 g de frango',
  language: 'en-US' as const,
};

describe('CreateManualMealUseCase', () => {
  let f: Fakes;
  let createManualMeal: CreateManualMealUseCase;

  beforeEach(() => {
    f = createFakes();
    createManualMeal = new CreateManualMealUseCase(
      f.meals,
      f.analyzer,
      f.ids,
      f.clock,
    );
  });

  it('should analyze the text and save the meal already analyzed', async () => {
    const meal = await createManualMeal.execute(INPUT);

    expect(f.analyzer.textCalls).toEqual([
      { text: INPUT.text, time: '12:30', language: 'en-US' },
    ]);
    expect(meal).toMatchObject({
      id: 'id-1',
      status: 'SUCCESS',
      inputType: 'MANUAL',
      inputText: INPUT.text,
      name: 'Almoço',
      attempts: 1,
    });
    expect(f.db.meals.get('id-1')?.items).toEqual(buildMealAnalysis().items);
  });

  it('should save nothing when the analysis fails', async () => {
    f.analyzer.error = new MealAnalysisFailedError();

    await expect(createManualMeal.execute(INPUT)).rejects.toThrow(
      MealAnalysisFailedError,
    );
    expect(f.db.meals.size).toBe(0);
  });

  it('should save nothing when no food is identified', async () => {
    f.analyzer.analysis = buildMealAnalysis({ items: [] });

    await expect(createManualMeal.execute(INPUT)).rejects.toThrow(
      MealWithoutItemsError,
    );
    expect(f.db.meals.size).toBe(0);
  });
});
