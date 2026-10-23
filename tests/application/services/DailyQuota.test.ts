import { beforeEach, describe, expect, it } from 'vitest';
import { DailyLimitReachedError } from '@/application/errors/DailyLimitReachedError';
import { DAILY_LIMITS, DailyQuota } from '@/application/services/DailyQuota';
import { createFakes, type Fakes } from '../../support/fakes/createFakes';
import { buildSubscription } from '../../support/fixtures/subscription';

describe('DailyQuota', () => {
  let f: Fakes;
  let quota: DailyQuota;

  async function consumeTimes(times: number, userId = 'user-1') {
    for (let used = 0; used < times; used++) {
      await quota.consume(userId, 'RECIPE');
    }
  }

  beforeEach(() => {
    f = createFakes();
    quota = new DailyQuota(f.usage, f.subscriptions, f.clock);
  });

  it('should allow up to the daily limit of each kind and refuse the next one', async () => {
    await consumeTimes(DAILY_LIMITS.FREE.RECIPE);

    await expect(quota.consume('user-1', 'RECIPE')).rejects.toThrow(
      DailyLimitReachedError,
    );
    await expect(
      quota.consume('user-1', 'MEAL_ANALYSIS'),
    ).resolves.toBeUndefined();
    await expect(quota.consume('user-2', 'RECIPE')).resolves.toBeUndefined();
  });

  it('should apply the premium limits while the subscription is active', async () => {
    f.db.putSubscription(buildSubscription({ status: 'ACTIVE' }));

    await consumeTimes(DAILY_LIMITS.PREMIUM.RECIPE);

    await expect(quota.consume('user-1', 'RECIPE')).rejects.toThrow(
      DailyLimitReachedError,
    );
  });

  it('should go back to the free limits when the subscription is canceled', async () => {
    f.db.putSubscription(buildSubscription({ status: 'CANCELED' }));

    await consumeTimes(DAILY_LIMITS.FREE.RECIPE);

    await expect(quota.consume('user-1', 'RECIPE')).rejects.toThrow(
      DailyLimitReachedError,
    );
  });

  it('should count by the UTC day', async () => {
    f.clock.current = new Date('2026-09-26T23:30:00.000-03:00');

    await quota.consume('user-1', 'RECIPE');

    expect(f.db.usage.get('user-1#2026-09-27#RECIPE')).toBe(1);
  });

  it('should limit 20 meal analyses and 5 recipes a day on free, and 100 and 30 on premium', () => {
    expect(DAILY_LIMITS).toEqual({
      FREE: { MEAL_ANALYSIS: 20, RECIPE: 5 },
      PREMIUM: { MEAL_ANALYSIS: 100, RECIPE: 30 },
    });
  });
});
