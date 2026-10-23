import { describe, expect, it } from 'vitest';
import {
  planOf,
  SUBSCRIPTION_STATUSES,
  type SubscriptionStatus,
} from '@/domain/entities/Subscription';
import { buildSubscription } from '../../support/fixtures/subscription';

const PREMIUM: SubscriptionStatus[] = ['TRIALING', 'ACTIVE', 'PAST_DUE'];

describe('Subscription', () => {
  it.each(PREMIUM)('should be premium while %s', (status) => {
    expect(buildSubscription({ status }).plan).toBe('PREMIUM');
  });

  it.each(SUBSCRIPTION_STATUSES.filter((status) => !PREMIUM.includes(status)))(
    'should be free when %s',
    (status) => {
      expect(buildSubscription({ status }).plan).toBe('FREE');
    },
  );

  it('should be free without a subscription', () => {
    expect(planOf(null)).toBe('FREE');
  });
});
