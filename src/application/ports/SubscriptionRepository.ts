import type { Subscription } from '@/domain/entities/Subscription';

export abstract class SubscriptionRepository {
  abstract findByUserId(userId: string): Promise<Subscription | null>;
}
