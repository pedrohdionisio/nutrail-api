import { describe, expect, it, vi } from 'vitest';
import { Saga } from '@/application/services/Saga';

describe('Saga', () => {
  it('should return the result without compensating when everything works', async () => {
    const saga = new Saga();
    const compensation = vi.fn();

    const result = await saga.run(async () => {
      saga.addCompensation(compensation);

      return 'done';
    });

    expect(result).toBe('done');
    expect(compensation).not.toHaveBeenCalled();
  });

  it('should compensate in reverse order and rethrow the original error', async () => {
    const saga = new Saga();
    const order: string[] = [];

    await expect(
      saga.run(async () => {
        saga.addCompensation(async () => {
          order.push('first');
        });
        saga.addCompensation(async () => {
          order.push('second');
        });
        throw new Error('step failed');
      }),
    ).rejects.toThrow('step failed');

    expect(order).toEqual(['second', 'first']);
  });

  it('should keep compensating when one compensation fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const saga = new Saga();
    const last = vi.fn();

    await expect(
      saga.run(async () => {
        saga.addCompensation(last);
        saga.addCompensation(async () => {
          throw new Error('compensation failed');
        });
        throw new Error('step failed');
      }),
    ).rejects.toThrow('step failed');

    expect(last).toHaveBeenCalledTimes(1);
  });
});
