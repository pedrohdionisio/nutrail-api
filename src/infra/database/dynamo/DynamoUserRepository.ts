import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import type { UserRepository } from '@/application/ports/UserRepository';
import { User } from '@/domain/entities/User';
import { Injectable } from '@/kernel/decorators/Injectable';
import { AppConfig } from '@/shared/config/AppConfig';

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
