import {
  DynamoDBDocumentClient,
  GetCommand,
  type GetCommandOutput,
} from '@aws-sdk/lib-dynamodb';
import type {
  GetProfileQuery,
  ProfileWithGoals,
} from '@/application/ports/GetProfileQuery';
import { Injectable } from '@/kernel/decorators/Injectable';
import { AppConfig } from '@/shared/config/AppConfig';

const PROFILE_ATTRIBUTES = [
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

const SUBSCRIPTION_ATTRIBUTES = ['status', 'cancelAt'];

@Injectable()
export class DynamoGetProfileQuery implements GetProfileQuery {
  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly config: AppConfig,
  ) {}

  async execute(userId: string): Promise<ProfileWithGoals | null> {
    const [profile, subscription] = await Promise.all([
      this.get(userId, 'PROFILE', PROFILE_ATTRIBUTES),
      this.get(userId, 'SUBSCRIPTION', SUBSCRIPTION_ATTRIBUTES),
    ]);

    if (!profile) return null;

    return {
      profile: {
        name: profile.name,
        email: profile.email,
        gender: profile.gender,
        birthDate: profile.birthDate,
        height: profile.height,
        weight: profile.weight,
        goal: profile.goal,
        activityLevel: profile.activityLevel,
      },
      goals: {
        calories: profile.calories,
        protein: profile.protein,
        carbohydrate: profile.carbohydrate,
        fat: profile.fat,
      },
      subscription: subscription
        ? {
            status: subscription.status,
            cancelAt: subscription.cancelAt ?? null,
          }
        : null,
    };
  }

  private async get(
    userId: string,
    sk: string,
    attributes: string[],
  ): Promise<GetCommandOutput['Item']> {
    const { Item } = await this.client.send(
      new GetCommand({
        TableName: this.config.tableName,
        Key: { PK: `USER#${userId}`, SK: sk },
        ProjectionExpression: attributes.map((name) => `#${name}`).join(', '),
        ExpressionAttributeNames: Object.fromEntries(
          attributes.map((name) => [`#${name}`, name]),
        ),
      }),
    );

    return Item;
  }
}
