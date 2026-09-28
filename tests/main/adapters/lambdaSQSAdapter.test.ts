import { describe, expect, it, vi } from 'vitest';
import { ProcessMealUseCase } from '@/application/usecases/meals/ProcessMealUseCase';
import { lambdaSQSAdapter } from '@/main/adapters/lambdaSQSAdapter';
import { container } from '@/main/container';
import { ProcessMealConsumer } from '@/presentation/queue-consumers/ProcessMealConsumer';
import { sqsEvent } from '../../support/app';

describe('lambdaSQSAdapter', () => {
  it('should process every record and return the ids of the failed ones', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(
      container.resolve(ProcessMealUseCase),
      'execute',
    ).mockImplementation(async ({ mealId }) => {
      if (mealId === 'broken') throw new Error('failed');
    });

    const result = await lambdaSQSAdapter(ProcessMealConsumer)(
      sqsEvent(
        { id: 'a', body: { userId: 'user-1', mealId: 'ok' } },
        { id: 'b', body: { userId: 'user-1', mealId: 'broken' } },
      ),
    );

    expect(result).toEqual({ batchItemFailures: [{ itemIdentifier: 'b' }] });
  });

  it('should report a record whose body is not JSON', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const event = sqsEvent({ id: 'a', body: {} });
    const [record] = event.Records;
    if (record) record.body = 'not json';

    expect(await lambdaSQSAdapter(ProcessMealConsumer)(event)).toEqual({
      batchItemFailures: [{ itemIdentifier: 'a' }],
    });
  });
});
