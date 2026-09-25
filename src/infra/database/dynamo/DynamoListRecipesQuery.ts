import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type {
  ListRecipesQuery,
  RecipeDetails,
} from '@/application/ports/ListRecipesQuery';
import { Injectable } from '@/kernel/decorators/Injectable';
import { AppConfig } from '@/shared/config/AppConfig';

const ATTRIBUTES = [
  'id',
  'name',
  'ingredients',
  'instructions',
  'calories',
  'protein',
  'carbohydrate',
  'fat',
  'createdAt',
];

@Injectable()
export class DynamoListRecipesQuery implements ListRecipesQuery {
  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly config: AppConfig,
  ) {}

  async execute(userId: string): Promise<RecipeDetails[]> {
    const recipes: RecipeDetails[] = [];
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
            ':prefix': 'RECIPE#',
          },
          ScanIndexForward: false,
          ExclusiveStartKey: cursor,
        }),
      );

      for (const item of Items) {
        recipes.push({
          id: item.id,
          name: item.name,
          ingredients: item.ingredients,
          instructions: item.instructions,
          calories: item.calories,
          protein: item.protein,
          carbohydrate: item.carbohydrate,
          fat: item.fat,
          createdAt: item.createdAt,
        });
      }

      cursor = LastEvaluatedKey;
    } while (cursor);

    return recipes;
  }
}
