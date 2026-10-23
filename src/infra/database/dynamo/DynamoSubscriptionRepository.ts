import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import type { SubscriptionRepository } from '@/application/ports/SubscriptionRepository';
import { Subscription } from '@/domain/entities/Subscription';
import { Injectable } from '@/kernel/decorators/Injectable';
import { AppConfig } from '@/shared/config/AppConfig';

@Injectable()
export class DynamoSubscriptionRepository implements SubscriptionRepository {
  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly config: AppConfig,
  ) {}

  async findByUserId(userId: string): Promise<Subscription | null> {
    const { Item } = await this.client.send(
      new GetCommand({
        TableName: this.config.tableName,
        Key: { PK: `USER#${userId}`, SK: 'SUBSCRIPTION' },
      }),
    );

    if (!Item) return null;

    return new Subscription({
      userId,
      customerId: Item.customerId,
      subscriptionId: Item.subscriptionId,
      status: Item.status,
      cancelAt: Item.cancelAt ?? null,
    });
  }
}
