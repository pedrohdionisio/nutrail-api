import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { InviteCodes } from '@/application/ports/InviteCodes';
import { Injectable } from '@/kernel/decorators/Injectable';
import { AppConfig } from '@/shared/config/AppConfig';

@Injectable()
export class DynamoInviteCodes implements InviteCodes {
  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly config: AppConfig,
  ) {}

  async redeem(code: string): Promise<boolean> {
    return this.addUse(code, 1, 'uses < maxUses');
  }

  async release(code: string): Promise<void> {
    await this.addUse(code, -1, 'uses > :zero');
  }

  private async addUse(
    code: string,
    amount: number,
    condition: string,
  ): Promise<boolean> {
    try {
      await this.client.send(
        new UpdateCommand({
          TableName: this.config.tableName,
          Key: { PK: `INVITE#${code}`, SK: 'INVITE' },
          UpdateExpression: 'ADD uses :amount',
          ConditionExpression: `attribute_exists(PK) AND ${condition}`,
          ExpressionAttributeValues: {
            ':amount': amount,
            ...(amount < 0 && { ':zero': 0 }),
          },
        }),
      );

      return true;
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        return false;
      }

      throw error;
    }
  }
}
