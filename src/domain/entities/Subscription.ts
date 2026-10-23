export const PLANS = ['FREE', 'PREMIUM'] as const;
export type Plan = (typeof PLANS)[number];

export const SUBSCRIPTION_STATUSES = [
  'INCOMPLETE',
  'INCOMPLETE_EXPIRED',
  'TRIALING',
  'ACTIVE',
  'PAST_DUE',
  'CANCELED',
  'UNPAID',
  'PAUSED',
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

const PREMIUM_STATUSES: readonly SubscriptionStatus[] = [
  'TRIALING',
  'ACTIVE',
  'PAST_DUE',
];

export function planOf(status: SubscriptionStatus | null): Plan {
  return status && PREMIUM_STATUSES.includes(status) ? 'PREMIUM' : 'FREE';
}

type SubscriptionProps = {
  userId: string;
  customerId: string;
  subscriptionId: string;
  status: SubscriptionStatus;
  cancelAt: string | null;
};

export class Subscription {
  readonly userId: string;
  readonly customerId: string;
  readonly subscriptionId: string;
  readonly status: SubscriptionStatus;
  readonly cancelAt: string | null;

  constructor(props: SubscriptionProps) {
    this.userId = props.userId;
    this.customerId = props.customerId;
    this.subscriptionId = props.subscriptionId;
    this.status = props.status;
    this.cancelAt = props.cancelAt;
  }

  get plan(): Plan {
    return planOf(this.status);
  }
}
