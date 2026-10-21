import { DailyLimitReachedError } from '@/application/errors/DailyLimitReachedError';
import { Clock } from '@/application/ports/Clock';
import { UsageCounter, type UsageKind } from '@/application/ports/UsageCounter';
import { Injectable } from '@/kernel/decorators/Injectable';

export const DAILY_LIMITS: Record<UsageKind, number> = {
  MEAL_ANALYSIS: 20,
  RECIPE: 5,
};

@Injectable()
export class DailyQuota {
  constructor(
    private readonly counter: UsageCounter,
    private readonly clock: Clock,
  ) {}

  async consume(userId: string, kind: UsageKind): Promise<void> {
    const allowed = await this.counter.increment({
      userId,
      kind,
      day: this.clock.now().toISOString().slice(0, 10),
      limit: DAILY_LIMITS[kind],
    });

    if (!allowed) {
      throw new DailyLimitReachedError();
    }
  }
}
