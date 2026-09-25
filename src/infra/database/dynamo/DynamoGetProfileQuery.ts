import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import type {
  GetProfileQuery,
  ProfileWithGoals,
} from '@/application/ports/GetProfileQuery';
import { Injectable } from '@/kernel/decorators/Injectable';
import { AppConfig } from '@/shared/config/AppConfig';

const ATTRIBUTES = [
  'name',
  'email',
  'gender',
  'birthDate',
  'height',
  'weight',
  'goal',
  'activityLevel',
  'calories',
  'protein',
  'carbohydrate',
  'fat',
];

@Injectable()
export class DynamoGetProfileQuery implements GetProfileQuery {
  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly config: AppConfig,
  ) {}

  async execute(userId: string): Promise<ProfileWithGoals | null> {
    const { Item } = await this.client.send(
      new GetCommand({
        TableName: this.config.tableName,
        Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
        ProjectionExpression: ATTRIBUTES.map((name) => `#${name}`).join(', '),
        ExpressionAttributeNames: Object.fromEntries(
          ATTRIBUTES.map((name) => [`#${name}`, name]),
        ),
      }),
    );

    if (!Item) return null;

    return {
      profile: {
        name: Item.name,
        email: Item.email,
        gender: Item.gender,
        birthDate: Item.birthDate,
        height: Item.height,
        weight: Item.weight,
        goal: Item.goal,
        activityLevel: Item.activityLevel,
      },
      goals: {
        calories: Item.calories,
        protein: Item.protein,
        carbohydrate: Item.carbohydrate,
        fat: Item.fat,
      },
    };
  }
}
