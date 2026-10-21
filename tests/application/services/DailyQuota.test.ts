import { beforeEach, describe, expect, it } from 'vitest';
import { DailyLimitReachedError } from '@/application/errors/DailyLimitReachedError';
import { DAILY_LIMITS, DailyQuota } from '@/application/services/DailyQuota';
import { createFakes, type Fakes } from '../../support/fakes/createFakes';

describe('DailyQuota', () => {
  let f: Fakes;
  let quota: DailyQuota;

  beforeEach(() => {
    f = createFakes();
    quota = new DailyQuota(f.usage, f.clock);
  });

  it('should allow up to the daily limit of each kind and refuse the next one', async () => {
    for (let used = 0; used < DAILY_LIMITS.RECIPE; used++) {
      await quota.consume('user-1', 'RECIPE');
    }

    await expect(quota.consume('user-1', 'RECIPE')).rejects.toThrow(
      DailyLimitReachedError,
    );
    await expect(
      quota.consume('user-1', 'MEAL_ANALYSIS'),
    ).resolves.toBeUndefined();
    await expect(quota.consume('user-2', 'RECIPE')).resolves.toBeUndefined();
  });

  it('should count by the UTC day', async () => {
    f.clock.current = new Date('2026-09-26T23:30:00.000-03:00');

    await quota.consume('user-1', 'RECIPE');

    expect(f.db.usage.get('user-1#2026-09-27#RECIPE')).toBe(1);
  });

  it('should limit 20 meal analyses and 5 recipes a day', () => {
    expect(DAILY_LIMITS).toEqual({ MEAL_ANALYSIS: 20, RECIPE: 5 });
  });
});
