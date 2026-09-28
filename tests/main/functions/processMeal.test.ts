import { describe, expect, it, vi } from 'vitest';
import { MealAnalysisFailedError } from '@/application/errors/MealAnalysisFailedError';
import { handler as createMeal } from '@/main/functions/createMeal';
import { handler as getMeal } from '@/main/functions/getMeal';
import { handler as mealUploaded } from '@/main/functions/mealUploaded';
import { handler } from '@/main/functions/processMeal';
import {
  fakes,
  givenSignedInUser,
  invoke,
  s3Event,
  sqsEvent,
} from '../../support/app';
import { buildPendingMeal } from '../../support/fixtures/meal';

describe('process meal (SQS consumer)', () => {
  it('should analyze queued meals and report no failures', async () => {
    fakes().db.putMeal(buildPendingMeal({ status: 'QUEUED' }));

    const result = await handler(
      sqsEvent({ id: 'm1', body: { userId: 'user-1', mealId: 'meal-1' } }),
    );

    expect(result).toEqual({ batchItemFailures: [] });
    expect(fakes().db.meals.get('meal-1')?.status).toBe('SUCCESS');
  });

  it('should report only the messages that failed, so the rest are not retried', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    fakes().db.putMeal(buildPendingMeal({ status: 'QUEUED' }));
    fakes().analyzer.error = new MealAnalysisFailedError();

    const result = await handler(
      sqsEvent(
        { id: 'fails', body: { userId: 'user-1', mealId: 'meal-1' } },
        { id: 'ignored', body: { userId: 'user-1', mealId: 'missing' } },
        { id: 'invalid', body: { mealId: '' } },
      ),
    );

    expect(result).toEqual({
      batchItemFailures: [
        { itemIdentifier: 'fails' },
        { itemIdentifier: 'invalid' },
      ],
    });
    expect(fakes().db.meals.get('meal-1')).toMatchObject({
      status: 'QUEUED',
      attempts: 1,
    });
  });

  it('should take a picture meal from creation to analysis', async () => {
    const user = givenSignedInUser();

    const created = await invoke(createMeal, {
      as: user,
      body: { date: '2026-09-26', time: '12:30', inputType: 'PICTURE' },
    });
    fakes().storage.putFile('pictures/user-1/id-1.jpg', {
      userid: 'user-1',
      mealid: 'id-1',
    });
    await mealUploaded(s3Event('pictures/user-1/id-1.jpg'));
    const [message] = fakes().queue.published;
    await handler(sqsEvent({ id: 'm1', body: message }));
    const meal = await invoke(getMeal, {
      as: user,
      params: { mealId: 'id-1' },
    });

    expect(created.statusCode).toBe(201);
    expect(meal.body).toMatchObject({
      id: 'id-1',
      status: 'SUCCESS',
      name: 'Almoço',
      calories: 403,
    });
  });
});
