import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import type { MealRepository } from '@/application/ports/MealRepository';
import { Meal } from '@/domain/entities/Meal';
import { DEFAULT_LANGUAGE } from '@/domain/value-objects/Language';
import { Injectable } from '@/kernel/decorators/Injectable';
import { AppConfig } from '@/shared/config/AppConfig';

@Injectable()
export class DynamoMealRepository implements MealRepository {
  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly config: AppConfig,
  ) {}

  async findById(userId: string, mealId: string): Promise<Meal | null> {
    const { Item } = await this.client.send(
      new GetCommand({
        TableName: this.config.tableName,
        Key: { PK: `USER#${userId}`, SK: `MEAL#${mealId}` },
      }),
    );

    if (!Item) return null;

    return new Meal({
      id: Item.id,
      userId,
      status: Item.status,
      inputType: Item.inputType,
      inputFileKey: Item.inputFileKey,
      inputText: Item.inputText,
      pictureKey: Item.pictureKey,
      name: Item.name,
      items: Item.items,
      attempts: Item.attempts,
      date: Item.date,
      time: Item.time,
      language: Item.language ?? DEFAULT_LANGUAGE,
      createdAt: Item.createdAt,
    });
  }

  async create(meal: Meal): Promise<void> {
    await this.put(meal, 'attribute_not_exists(PK)');
  }

  async update(meal: Meal): Promise<void> {
    await this.put(meal, 'attribute_exists(PK)');
  }

  async delete(userId: string, mealId: string): Promise<void> {
    await this.client.send(
      new DeleteCommand({
        TableName: this.config.tableName,
        Key: { PK: `USER#${userId}`, SK: `MEAL#${mealId}` },
      }),
    );
  }

  private async put(meal: Meal, condition: string): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.config.tableName,
        Item: {
          PK: `USER#${meal.userId}`,
          SK: `MEAL#${meal.id}`,
          GSI1PK: `MEAL#${meal.userId}#${meal.date}`,
          GSI1SK: `MEAL#${meal.createdAt}`,
          id: meal.id,
          name: meal.name,
          items: meal.items,
          ...meal.totals,
          status: meal.status,
          inputType: meal.inputType,
          inputFileKey: meal.inputFileKey,
          inputText: meal.inputText,
          pictureKey: meal.pictureKey,
          attempts: meal.attempts,
          date: meal.date,
          time: meal.time,
          language: meal.language,
          createdAt: meal.createdAt,
        },
        ConditionExpression: condition,
      }),
    );
  }
}
