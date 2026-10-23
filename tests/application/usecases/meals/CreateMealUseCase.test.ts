import { beforeEach, describe, expect, it } from 'vitest';
import { DailyLimitReachedError } from '@/application/errors/DailyLimitReachedError';
import { DailyQuota } from '@/application/services/DailyQuota';
import { CreateMealUseCase } from '@/application/usecases/meals/CreateMealUseCase';
import { createFakes, type Fakes } from '../../../support/fakes/createFakes';
import { UPLOAD_URL } from '../../../support/fakes/FakeFileStorage';
import { exhaustDailyLimit } from '../../../support/fakes/InMemoryUsageCounter';

describe('CreateMealUseCase', () => {
  let f: Fakes;
  let createMeal: CreateMealUseCase;

  beforeEach(() => {
    f = createFakes();
    createMeal = new CreateMealUseCase(
      f.meals,
      f.storage,
      f.ids,
      f.clock,
      new DailyQuota(f.usage, f.subscriptions, f.clock),
    );
  });

  it('should create an uploading picture meal whose picture is its input', async () => {
    const result = await createMeal.execute({
      userId: 'user-1',
      date: '2026-09-26',
      time: '12:30',
      inputType: 'PICTURE',
      language: 'en-US',
    });

    expect(result).toEqual({
      mealId: 'id-1',
      upload: {
        url: UPLOAD_URL,
        fields: {
          key: 'pictures/user-1/id-1.jpg',
          'Content-Type': 'image/jpeg',
        },
      },
    });
    expect(f.db.meals.get('id-1')).toMatchObject({
      status: 'UPLOADING',
      inputType: 'PICTURE',
      inputFileKey: 'pictures/user-1/id-1.jpg',
      pictureKey: 'pictures/user-1/id-1.jpg',
      attempts: 0,
      date: '2026-09-26',
      time: '12:30',
      language: 'en-US',
      createdAt: '2026-09-26T15:00:00.000Z',
    });
    expect(f.storage.uploads).toEqual([
      {
        key: 'pictures/user-1/id-1.jpg',
        contentType: 'image/jpeg',
        maxSizeBytes: 10 * 1024 * 1024,
        metadata: { userid: 'user-1', mealid: 'id-1' },
      },
    ]);
  });

  it('should create an audio meal without a registration picture', async () => {
    await createMeal.execute({
      userId: 'user-1',
      date: '2026-09-26',
      time: '12:30',
      inputType: 'AUDIO',
      language: 'pt-BR',
    });

    expect(f.db.meals.get('id-1')).toMatchObject({
      inputType: 'AUDIO',
      inputFileKey: 'inputs/user-1/id-1.m4a',
      pictureKey: null,
    });
    expect(f.storage.uploads[0]?.contentType).toBe('audio/m4a');
  });

  it('should refuse when the daily limit was reached, without creating the meal', async () => {
    exhaustDailyLimit(f.db, 'user-1', 'MEAL_ANALYSIS');

    await expect(
      createMeal.execute({
        userId: 'user-1',
        date: '2026-09-26',
        time: '12:30',
        inputType: 'PICTURE',
        language: 'en-US',
      }),
    ).rejects.toThrow(DailyLimitReachedError);
    expect(f.db.meals.size).toBe(0);
    expect(f.storage.uploads).toEqual([]);
  });
});
