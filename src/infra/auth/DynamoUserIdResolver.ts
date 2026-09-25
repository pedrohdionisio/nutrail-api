import { setTimeout } from 'node:timers/promises';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { UserIdResolver } from '@/application/ports/UserIdResolver';
import { Injectable } from '@/kernel/decorators/Injectable';
import { AppConfig } from '@/shared/config/AppConfig';

const RETRY_DELAYS_MS = [100, 200];

@Injectable()
export class DynamoUserIdResolver implements UserIdResolver {
  private readonly cache = new Map<string, string>();

  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly config: AppConfig,
  ) {}

  async resolve(externalId: string): Promise<string | null> {
    const cached = this.cache.get(externalId);

    if (cached) return cached;

    let userId = await this.query(externalId);

    for (const delay of RETRY_DELAYS_MS) {
      if (userId) break;

      await setTimeout(delay);

      userId = await this.query(externalId);
    }

    if (userId) this.cache.set(externalId, userId);

    return userId;
  }

  private async query(externalId: string): Promise<string | null> {
    const { Items } = await this.client.send(
      new QueryCommand({
        TableName: this.config.tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK = :sk',
        ExpressionAttributeValues: {
          ':pk': `COGNITO#${externalId}`,
          ':sk': 'PROFILE',
        },
        ProjectionExpression: 'id',
        Limit: 1,
      }),
    );

    const id = Items?.[0]?.id;

    return typeof id === 'string' ? id : null;
  }
}
