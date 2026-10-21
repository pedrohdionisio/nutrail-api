import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type {
  UsageCounter,
  UsageIncrement,
  UsageKind,
} from '@/application/ports/UsageCounter';
import { Injectable } from '@/kernel/decorators/Injectable';
import { AppConfig } from '@/shared/config/AppConfig';

const ATTRIBUTES: Record<UsageKind, string> = {
  MEAL_ANALYSIS: 'mealAnalyses',
  RECIPE: 'recipes',
};

const RETENTION_SECONDS = 2 * 24 * 60 * 60;

@Injectable()
export class DynamoUsageCounter implements UsageCounter {
  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly config: AppConfig,
  ) {}

  async increment({
    userId,
    kind,
    day,
    limit,
  }: UsageIncrement): Promise<boolean> {
    try {
      await this.client.send(
        new UpdateCommand({
          TableName: this.config.tableName,
          Key: { PK: `USER#${userId}`, SK: `USAGE#${day}` },
          UpdateExpression:
            'ADD #count :one SET #ttl = if_not_exists(#ttl, :ttl)',
          ConditionExpression:
            'attribute_not_exists(#count) OR #count < :limit',
          ExpressionAttributeNames: {
            '#count': ATTRIBUTES[kind],
            '#ttl': 'ttl',
          },
          ExpressionAttributeValues: {
            ':one': 1,
            ':limit': limit,
            ':ttl':
              Date.parse(`${day}T00:00:00.000Z`) / 1000 + RETENTION_SECONDS,
          },
        }),
      );

      return true;
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        return false;
      }

      throw error;
    }
  }
}
