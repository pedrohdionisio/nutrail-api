import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import type {
  GetMealQuery,
  MealDetails,
} from '@/application/ports/GetMealQuery';
import { Injectable } from '@/kernel/decorators/Injectable';
import { AppConfig } from '@/shared/config/AppConfig';

const ATTRIBUTES = [
  'id',
  'name',
  'status',
  'inputType',
  'date',
  'items',
  'calories',
  'protein',
  'carbohydrate',
  'fat',
  'createdAt',
];

@Injectable()
export class DynamoGetMealQuery implements GetMealQuery {
  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly config: AppConfig,
  ) {}

  async execute({
    userId,
    mealId,
  }: {
    userId: string;
    mealId: string;
  }): Promise<MealDetails | null> {
    const { Item } = await this.client.send(
      new GetCommand({
        TableName: this.config.tableName,
        Key: { PK: `USER#${userId}`, SK: `MEAL#${mealId}` },
        ProjectionExpression: ATTRIBUTES.map((name) => `#${name}`).join(', '),
        ExpressionAttributeNames: Object.fromEntries(
          ATTRIBUTES.map((name) => [`#${name}`, name]),
        ),
      }),
    );

    if (!Item) return null;

    return {
      id: Item.id,
      name: Item.name,
      status: Item.status,
      inputType: Item.inputType,
      date: Item.date,
      items: Item.items,
      calories: Item.calories,
      protein: Item.protein,
      carbohydrate: Item.carbohydrate,
      fat: Item.fat,
      createdAt: Item.createdAt,
    };
  }
}
