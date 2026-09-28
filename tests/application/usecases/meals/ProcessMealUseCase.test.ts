import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MealAnalysisFailedError } from '@/application/errors/MealAnalysisFailedError';
import { ProcessMealUseCase } from '@/application/usecases/meals/ProcessMealUseCase';
import { createFakes, type Fakes } from '../../../support/fakes/createFakes';
import { readUrlOf } from '../../../support/fakes/FakeFileStorage';
import {
  buildMealAnalysis,
  buildPendingMeal,
} from '../../../support/fixtures/meal';

const MESSAGE = { userId: 'user-1', mealId: 'meal-1' };

describe('ProcessMealUseCase', () => {
  let f: Fakes;
  let processMeal: ProcessMealUseCase;

  beforeEach(() => {
    f = createFakes();
    processMeal = new ProcessMealUseCase(
      f.meals,
      f.storage,
      f.analyzer,
      f.transcriber,
    );
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('should analyze the picture of a picture meal', async () => {
    f.db.putMeal(buildPendingMeal({ status: 'QUEUED' }));

    await processMeal.execute(MESSAGE);

    expect(f.analyzer.imageCalls).toEqual([
      { imageUrl: readUrlOf('pictures/user-1/meal-1.jpg'), time: '12:30' },
    ]);
    expect(f.db.meals.get('meal-1')).toMatchObject({
      status: 'SUCCESS',
      name: 'Almoço',
      attempts: 1,
    });
  });

  it('should transcribe the audio, keep the transcription and analyze the text', async () => {
    f.db.putMeal(
      buildPendingMeal({
        status: 'QUEUED',
        inputType: 'AUDIO',
        inputFileKey: 'inputs/user-1/meal-1.m4a',
        pictureKey: null,
      }),
    );

    await processMeal.execute(MESSAGE);

    expect(f.transcriber.calls).toEqual([
      readUrlOf('inputs/user-1/meal-1.m4a'),
    ]);
    expect(f.analyzer.textCalls).toEqual([
      { text: f.transcriber.text, time: '12:30' },
    ]);
    expect(f.db.meals.get('meal-1')).toMatchObject({
      status: 'SUCCESS',
      inputText: f.transcriber.text,
    });
  });

  it('should reuse a transcription already saved instead of transcribing again', async () => {
    f.db.putMeal(
      buildPendingMeal({
        status: 'QUEUED',
        inputType: 'AUDIO',
        inputFileKey: 'inputs/user-1/meal-1.m4a',
        inputText: 'Comi uma banana',
      }),
    );

    await processMeal.execute(MESSAGE);

    expect(f.transcriber.calls).toEqual([]);
    expect(f.analyzer.textCalls[0]?.text).toBe('Comi uma banana');
  });

  it('should ignore meals that are not queued or no longer exist', async () => {
    f.db.putMeal(buildPendingMeal({ status: 'PROCESSING' }));

    await processMeal.execute(MESSAGE);
    await processMeal.execute({ userId: 'user-1', mealId: 'missing' });

    expect(f.analyzer.imageCalls).toEqual([]);
    expect(f.db.meals.get('meal-1')?.status).toBe('PROCESSING');
  });

  it('should queue the meal again and rethrow a transient error while attempts remain', async () => {
    f.db.putMeal(buildPendingMeal({ status: 'QUEUED', attempts: 1 }));
    f.analyzer.error = new MealAnalysisFailedError();

    await expect(processMeal.execute(MESSAGE)).rejects.toThrow(
      MealAnalysisFailedError,
    );
    expect(f.db.meals.get('meal-1')).toMatchObject({
      status: 'QUEUED',
      attempts: 2,
    });
  });

  it('should fail the meal on the third attempt', async () => {
    f.db.putMeal(buildPendingMeal({ status: 'QUEUED', attempts: 2 }));
    f.analyzer.error = new Error('OpenAI timeout');

    await processMeal.execute(MESSAGE);

    expect(f.db.meals.get('meal-1')).toMatchObject({
      status: 'FAILED',
      attempts: 3,
    });
  });

  it('should fail at once when no food is identified, without retrying', async () => {
    f.db.putMeal(buildPendingMeal({ status: 'QUEUED' }));
    f.analyzer.analysis = buildMealAnalysis({ items: [] });

    await processMeal.execute(MESSAGE);

    expect(f.db.meals.get('meal-1')).toMatchObject({
      status: 'FAILED',
      attempts: 1,
    });
  });
});
