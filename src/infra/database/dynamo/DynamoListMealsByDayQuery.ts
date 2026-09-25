import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type {
  ListMealsByDayQuery,
  MealSummary,
  MealsOfDay,
} from '@/application/ports/ListMealsByDayQuery';
import type { Macros } from '@/domain/value-objects/Macros';
import { Injectable } from '@/kernel/decorators/Injectable';
import { AppConfig } from '@/shared/config/AppConfig';

const ATTRIBUTES = [
  'id',
  'name',
  'inputType',
  'calories',
  'protein',
  'carbohydrate',
  'fat',
  'createdAt',
];

@Injectable()
export class DynamoListMealsByDayQuery implements ListMealsByDayQuery {
  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly config: AppConfig,
  ) {}

  async execute({
    userId,
    date,
  }: {
    userId: string;
    date: string;
  }): Promise<MealsOfDay> {
    const meals: MealSummary[] = [];
    let cursor: Record<string, unknown> | undefined;

    do {
      const { Items = [], LastEvaluatedKey } = await this.client.send(
        new QueryCommand({
          TableName: this.config.tableName,
          IndexName: 'GSI1',
          KeyConditionExpression: 'GSI1PK = :pk',
          FilterExpression: '#status = :success',
          ProjectionExpression: ATTRIBUTES.map((name) => `#${name}`).join(', '),
          ExpressionAttributeNames: {
            '#status': 'status',
            ...Object.fromEntries(ATTRIBUTES.map((name) => [`#${name}`, name])),
          },
          ExpressionAttributeValues: {
            ':pk': `MEAL#${userId}#${date}`,
            ':success': 'SUCCESS',
          },
          ExclusiveStartKey: cursor,
        }),
      );

      for (const item of Items) {
        meals.push({
          id: item.id,
          name: item.name,
          inputType: item.inputType,
          calories: item.calories,
          protein: item.protein,
          carbohydrate: item.carbohydrate,
          fat: item.fat,
          createdAt: item.createdAt,
        });
      }

      cursor = LastEvaluatedKey;
    } while (cursor);

    return { meals, totals: sumTotals(meals) };
  }
}

function sumTotals(meals: MealSummary[]): Macros {
  const sum = (key: keyof Macros) =>
    Math.round(meals.reduce((total, meal) => total + meal[key], 0) * 10) / 10;

  return {
    calories: Math.round(sum('calories')),
    protein: sum('protein'),
    carbohydrate: sum('carbohydrate'),
    fat: sum('fat'),
  };
}
