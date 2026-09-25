import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import type { UserRepository } from '@/application/ports/UserRepository';
import type { User } from '@/domain/entities/User';
import { Injectable } from '@/kernel/decorators/Injectable';
import { AppConfig } from '@/shared/config/AppConfig';

@Injectable()
export class DynamoUserRepository implements UserRepository {
  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly config: AppConfig,
  ) {}

  async create(user: User): Promise<void> {
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
        ConditionExpression: 'attribute_not_exists(PK)',
      }),
    );
  }
}
