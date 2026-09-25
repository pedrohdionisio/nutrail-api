import { setTimeout } from 'node:timers/promises';
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import type { UserRepository } from '@/application/ports/UserRepository';
import { User } from '@/domain/entities/User';
import { Injectable } from '@/kernel/decorators/Injectable';
import { AppConfig } from '@/shared/config/AppConfig';

const BATCH_SIZE = 25;
const MAX_BATCH_ATTEMPTS = 5;

@Injectable()
export class DynamoUserRepository implements UserRepository {
  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly config: AppConfig,
  ) {}

  async findById(id: string): Promise<User | null> {
    const { Item } = await this.client.send(
      new GetCommand({
        TableName: this.config.tableName,
        Key: { PK: `USER#${id}`, SK: 'PROFILE' },
      }),
    );

    if (!Item) return null;

    return new User({
      id: Item.id,
      externalId: Item.externalId,
      email: Item.email,
      name: Item.name,
      gender: Item.gender,
      birthDate: Item.birthDate,
      height: Item.height,
      weight: Item.weight,
      goal: Item.goal,
      activityLevel: Item.activityLevel,
      goals: {
        calories: Item.calories,
        protein: Item.protein,
        carbohydrate: Item.carbohydrate,
        fat: Item.fat,
      },
      createdAt: Item.createdAt,
    });
  }

  async create(user: User): Promise<void> {
    await this.put(user, 'attribute_not_exists(PK)');
  }

  async update(user: User): Promise<void> {
    await this.put(user, 'attribute_exists(PK)');
  }

  async deleteWithAllData(id: string): Promise<void> {
    let cursor: Record<string, unknown> | undefined;

    do {
      const { Items = [], LastEvaluatedKey } = await this.client.send(
        new QueryCommand({
          TableName: this.config.tableName,
          KeyConditionExpression: 'PK = :pk',
          ExpressionAttributeValues: { ':pk': `USER#${id}` },
          ProjectionExpression: 'PK, SK',
          ExclusiveStartKey: cursor,
        }),
      );

      for (let start = 0; start < Items.length; start += BATCH_SIZE) {
        await this.deleteBatch(Items.slice(start, start + BATCH_SIZE));
      }

      cursor = LastEvaluatedKey;
    } while (cursor);
  }

  private async deleteBatch(keys: Record<string, unknown>[]): Promise<void> {
    let requests = keys.map((key) => ({
      DeleteRequest: { Key: { PK: key.PK, SK: key.SK } },
    }));

    for (let attempt = 1; requests.length > 0; attempt++) {
      if (attempt > MAX_BATCH_ATTEMPTS) {
        throw new Error(`Could not delete ${requests.length} user items.`);
      }

      const { UnprocessedItems } = await this.client.send(
        new BatchWriteCommand({
          RequestItems: { [this.config.tableName]: requests },
        }),
      );

      requests = (UnprocessedItems?.[this.config.tableName] ??
        []) as typeof requests;

      if (requests.length > 0) {
        await setTimeout(100 * 2 ** attempt);
      }
    }
  }

  private async put(user: User, condition: string): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.config.tableName,
        Item: {
          PK: `USER#${user.id}`,
          SK: 'PROFILE',
          GSI1PK: `COGNITO#${user.externalId}`,
          GSI1SK: 'PROFILE',
          id: user.id,
          externalId: user.externalId,
          name: user.name,
          email: user.email,
          gender: user.gender,
          height: user.height,
          weight: user.weight,
          goal: user.goal,
          birthDate: user.birthDate,
          activityLevel: user.activityLevel,
          ...user.goals,
          createdAt: user.createdAt,
        },
        ConditionExpression: condition,
      }),
    );
  }
}
