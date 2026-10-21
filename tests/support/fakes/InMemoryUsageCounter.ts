import type {
  UsageCounter,
  UsageIncrement,
  UsageKind,
} from '@/application/ports/UsageCounter';
import { DAILY_LIMITS } from '@/application/services/DailyQuota';
import type { InMemoryDatabase } from './InMemoryDatabase';

export class InMemoryUsageCounter implements UsageCounter {
  constructor(private readonly db: InMemoryDatabase) {}

  async increment({
    userId,
    kind,
    day,
    limit,
  }: UsageIncrement): Promise<boolean> {
    const key = usageKey(userId, day, kind);
    const count = this.db.usage.get(key) ?? 0;

    if (count >= limit) {
      return false;
    }

    this.db.usage.set(key, count + 1);

    return true;
  }
}

export function usageKey(userId: string, day: string, kind: UsageKind): string {
  return `${userId}#${day}#${kind}`;
}

export function exhaustDailyLimit(
  db: InMemoryDatabase,
  userId: string,
  kind: UsageKind,
): void {
  db.usage.set(usageKey(userId, '2026-09-26', kind), DAILY_LIMITS[kind]);
}
