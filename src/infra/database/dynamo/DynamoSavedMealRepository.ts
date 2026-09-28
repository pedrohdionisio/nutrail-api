import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import type { SavedMealRepository } from '@/application/ports/SavedMealRepository';
import { SavedMeal } from '@/domain/entities/SavedMeal';
import { Injectable } from '@/kernel/decorators/Injectable';
import { AppConfig } from '@/shared/config/AppConfig';

@Injectable()
export class DynamoSavedMealRepository implements SavedMealRepository {
  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly config: AppConfig,
  ) {}

  async findById(
    userId: string,
    savedMealId: string,
  ): Promise<SavedMeal | null> {
    const { Item } = await this.client.send(
      new GetCommand({
        TableName: this.config.tableName,
        Key: { PK: `USER#${userId}`, SK: `SAVED_MEAL#${savedMealId}` },
      }),
    );

    if (!Item) return null;

    return new SavedMeal({
      id: Item.id,
      userId,
      name: Item.name,
      items: Item.items,
      createdAt: Item.createdAt,
    });
  }

  async create(savedMeal: SavedMeal): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.config.tableName,
        Item: {
          PK: `USER#${savedMeal.userId}`,
          SK: `SAVED_MEAL#${savedMeal.id}`,
          id: savedMeal.id,
          name: savedMeal.name,
          items: savedMeal.items,
          ...savedMeal.totals,
          createdAt: savedMeal.createdAt,
        },
        ConditionExpression: 'attribute_not_exists(PK)',
      }),
    );
  }

  async delete(userId: string, savedMealId: string): Promise<boolean> {
    const { Attributes } = await this.client.send(
      new DeleteCommand({
        TableName: this.config.tableName,
        Key: { PK: `USER#${userId}`, SK: `SAVED_MEAL#${savedMealId}` },
        ReturnValues: 'ALL_OLD',
      }),
    );

    return Attributes !== undefined;
  }
}
