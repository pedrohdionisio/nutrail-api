import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type {
  ListSavedMealsQuery,
  SavedMealDetails,
} from '@/application/ports/ListSavedMealsQuery';
import { Injectable } from '@/kernel/decorators/Injectable';
import { AppConfig } from '@/shared/config/AppConfig';

const ATTRIBUTES = [
  'id',
  'name',
  'items',
  'calories',
  'protein',
  'carbohydrate',
  'fat',
  'createdAt',
];

@Injectable()
export class DynamoListSavedMealsQuery implements ListSavedMealsQuery {
  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly config: AppConfig,
  ) {}

  async execute(userId: string): Promise<SavedMealDetails[]> {
    const savedMeals: SavedMealDetails[] = [];
    let cursor: Record<string, unknown> | undefined;

    do {
      const { Items = [], LastEvaluatedKey } = await this.client.send(
        new QueryCommand({
          TableName: this.config.tableName,
          KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
          ProjectionExpression: ATTRIBUTES.map((name) => `#${name}`).join(', '),
          ExpressionAttributeNames: Object.fromEntries(
            ATTRIBUTES.map((name) => [`#${name}`, name]),
          ),
          ExpressionAttributeValues: {
            ':pk': `USER#${userId}`,
            ':prefix': 'SAVED_MEAL#',
          },
          ScanIndexForward: false,
          ExclusiveStartKey: cursor,
        }),
      );

      for (const item of Items) {
        savedMeals.push({
          id: item.id,
          name: item.name,
          items: item.items,
          calories: item.calories,
          protein: item.protein,
          carbohydrate: item.carbohydrate,
          fat: item.fat,
          createdAt: item.createdAt,
        });
      }

      cursor = LastEvaluatedKey;
    } while (cursor);

    return savedMeals;
  }
}
