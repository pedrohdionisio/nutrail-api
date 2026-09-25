import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import type { MealRepository } from '@/application/ports/MealRepository';
import type { Meal } from '@/domain/entities/Meal';
import { Injectable } from '@/kernel/decorators/Injectable';
import { AppConfig } from '@/shared/config/AppConfig';

@Injectable()
export class DynamoMealRepository implements MealRepository {
  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly config: AppConfig,
  ) {}

  async create(meal: Meal): Promise<void> {
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
          createdAt: meal.createdAt,
        },
        ConditionExpression: 'attribute_not_exists(PK)',
      }),
    );
  }
}
