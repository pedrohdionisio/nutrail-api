import { Subscription } from '@/domain/entities/Subscription';

type SubscriptionOverrides = Partial<
  ConstructorParameters<typeof Subscription>[0]
>;

export function buildSubscription(
  overrides: SubscriptionOverrides = {},
): Subscription {
  return new Subscription({
    userId: 'user-1',
    customerId: 'cus_1',
    subscriptionId: 'sub_1',
    status: 'ACTIVE',
    cancelAt: null,
    ...overrides,
  });
}
