import type { SubscriptionRepository } from '@/application/ports/SubscriptionRepository';
import { Subscription } from '@/domain/entities/Subscription';
import type { InMemoryDatabase } from './InMemoryDatabase';

export class InMemorySubscriptionRepository implements SubscriptionRepository {
  constructor(private readonly db: InMemoryDatabase) {}

  async findByUserId(userId: string): Promise<Subscription | null> {
    const subscription = this.db.subscriptions.get(userId);

    return subscription ? new Subscription(subscription) : null;
  }
}
