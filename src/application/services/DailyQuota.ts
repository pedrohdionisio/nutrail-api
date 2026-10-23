import { DailyLimitReachedError } from '@/application/errors/DailyLimitReachedError';
import { Clock } from '@/application/ports/Clock';
import { SubscriptionRepository } from '@/application/ports/SubscriptionRepository';
import { UsageCounter, type UsageKind } from '@/application/ports/UsageCounter';
import type { Plan } from '@/domain/entities/Subscription';
import { Injectable } from '@/kernel/decorators/Injectable';

export const DAILY_LIMITS: Record<Plan, Record<UsageKind, number>> = {
  FREE: { MEAL_ANALYSIS: 20, RECIPE: 5 },
  PREMIUM: { MEAL_ANALYSIS: 100, RECIPE: 30 },
};

@Injectable()
export class DailyQuota {
  constructor(
    private readonly counter: UsageCounter,
    private readonly subscriptions: SubscriptionRepository,
    private readonly clock: Clock,
  ) {}

  async consume(userId: string, kind: UsageKind): Promise<void> {
    const subscription = await this.subscriptions.findByUserId(userId);
    const plan = subscription?.plan ?? 'FREE';

    const allowed = await this.counter.increment({
      userId,
      kind,
      day: this.clock.now().toISOString().slice(0, 10),
      limit: DAILY_LIMITS[plan][kind],
    });

    if (!allowed) {
      throw new DailyLimitReachedError();
    }
  }
}
