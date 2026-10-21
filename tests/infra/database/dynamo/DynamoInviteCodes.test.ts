import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { describe, expect, it } from 'vitest';
import { DynamoInviteCodes } from '@/infra/database/dynamo/DynamoInviteCodes';
import { createDynamo, TABLE } from '../../../support/dynamo';

const conditionFailed = () =>
  new ConditionalCheckFailedException({
    message: 'The conditional request failed',
    $metadata: {},
  });

describe('DynamoInviteCodes', () => {
  it('should add a use to an existing invite that still has uses left', async () => {
    const { client, mock, config } = createDynamo();
    mock.on(UpdateCommand).resolves({});

    await expect(
      new DynamoInviteCodes(client, config).redeem('NUTRAIL-BETA'),
    ).resolves.toBe(true);
    expect(mock.commandCalls(UpdateCommand)[0]?.args[0].input).toEqual({
      TableName: TABLE,
      Key: { PK: 'INVITE#NUTRAIL-BETA', SK: 'INVITE' },
      UpdateExpression: 'ADD uses :amount',
      ConditionExpression: 'attribute_exists(PK) AND uses < maxUses',
      ExpressionAttributeValues: { ':amount': 1 },
    });
  });

  it('should refuse an invite that does not exist or was used up', async () => {
    const { client, mock, config } = createDynamo();
    mock.on(UpdateCommand).rejects(conditionFailed());

    await expect(
      new DynamoInviteCodes(client, config).redeem('NOPE'),
    ).resolves.toBe(false);
  });

  it('should give a use back without going below zero', async () => {
    const { client, mock, config } = createDynamo();
    mock.on(UpdateCommand).rejects(conditionFailed());

    await expect(
      new DynamoInviteCodes(client, config).release('NUTRAIL-BETA'),
    ).resolves.toBeUndefined();
    expect(mock.commandCalls(UpdateCommand)[0]?.args[0].input).toMatchObject({
      UpdateExpression: 'ADD uses :amount',
      ConditionExpression: 'attribute_exists(PK) AND uses > :zero',
      ExpressionAttributeValues: { ':amount': -1, ':zero': 0 },
    });
  });

  it('should rethrow any other error', async () => {
    const { client, mock, config } = createDynamo();
    mock.on(UpdateCommand).rejects(new Error('throttled'));

    await expect(
      new DynamoInviteCodes(client, config).redeem('NUTRAIL-BETA'),
    ).rejects.toThrow('throttled');
  });
});
