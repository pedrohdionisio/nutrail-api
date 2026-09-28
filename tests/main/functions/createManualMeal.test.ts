import { describe, expect, it } from 'vitest';
import { MealAnalysisFailedError } from '@/application/errors/MealAnalysisFailedError';
import { handler } from '@/main/functions/createManualMeal';
import {
  errorBody,
  fakes,
  givenSignedInUser,
  invoke,
  validationErrorBody,
} from '../../support/app';
import { buildMealAnalysis } from '../../support/fixtures/meal';

const BODY = {
  date: '2026-09-26',
  time: '12:30',
  text: '120 g de arroz e 150 g de frango',
};

describe('POST /meals/manual', () => {
  it('should analyze the text and return the analyzed meal with totals', async () => {
    const user = givenSignedInUser();

    expect(await invoke(handler, { as: user, body: BODY })).toEqual({
      statusCode: 201,
      body: {
        id: 'id-1',
        name: 'Almoço',
        status: 'SUCCESS',
        inputType: 'MANUAL',
        date: '2026-09-26',
        items: buildMealAnalysis().items,
        calories: 403,
        protein: 49.6,
        carbohydrate: 34,
        fat: 5.7,
        createdAt: '2026-09-26T15:00:00.000Z',
      },
    });
    expect(fakes().analyzer.textCalls).toEqual([
      { text: BODY.text, time: '12:30' },
    ]);
  });

  it('should answer 422 when no food is identified', async () => {
    const user = givenSignedInUser();
    fakes().analyzer.analysis = buildMealAnalysis({ items: [] });

    expect(await invoke(handler, { as: user, body: BODY })).toEqual({
      statusCode: 422,
      body: errorBody('MEAL_WITHOUT_ITEMS'),
    });
    expect(fakes().db.meals.size).toBe(0);
  });

  it('should answer 502 when the analysis fails', async () => {
    const user = givenSignedInUser();
    fakes().analyzer.error = new MealAnalysisFailedError();

    expect(await invoke(handler, { as: user, body: BODY })).toEqual({
      statusCode: 502,
      body: errorBody('MEAL_ANALYSIS_FAILED'),
    });
  });

  it('should refuse an empty or too long description', async () => {
    const user = givenSignedInUser();

    expect(
      await invoke(handler, { as: user, body: { ...BODY, text: '   ' } }),
    ).toEqual({
      statusCode: 400,
      body: validationErrorBody('text'),
    });
    expect(
      await invoke(handler, {
        as: user,
        body: { ...BODY, text: 'a'.repeat(1001) },
      }),
    ).toEqual({ statusCode: 400, body: validationErrorBody('text') });
  });
});
