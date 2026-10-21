import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { describe, expect, it } from 'vitest';
import { DynamoUsageCounter } from '@/infra/database/dynamo/DynamoUsageCounter';
import { createDynamo, TABLE } from '../../../support/dynamo';

const INCREMENT = {
  userId: 'user-1',
  kind: 'MEAL_ANALYSIS' as const,
  day: '2026-09-26',
  limit: 20,
};

describe('DynamoUsageCounter', () => {
  it('should add one to the counter of the day while it is below the limit', async () => {
    const { client, mock, config } = createDynamo();
    mock.on(UpdateCommand).resolves({});

    await expect(
      new DynamoUsageCounter(client, config).increment(INCREMENT),
    ).resolves.toBe(true);
    expect(mock.commandCalls(UpdateCommand)[0]?.args[0].input).toEqual({
      TableName: TABLE,
      Key: { PK: 'USER#user-1', SK: 'USAGE#2026-09-26' },
      UpdateExpression: 'ADD #count :one SET #ttl = if_not_exists(#ttl, :ttl)',
      ConditionExpression: 'attribute_not_exists(#count) OR #count < :limit',
      ExpressionAttributeNames: { '#count': 'mealAnalyses', '#ttl': 'ttl' },
      ExpressionAttributeValues: {
        ':one': 1,
        ':limit': 20,
        ':ttl': Date.parse('2026-09-28T00:00:00.000Z') / 1000,
      },
    });
  });

  it('should count recipes in their own attribute', async () => {
    const { client, mock, config } = createDynamo();
    mock.on(UpdateCommand).resolves({});

    await new DynamoUsageCounter(client, config).increment({
      ...INCREMENT,
      kind: 'RECIPE',
      limit: 5,
    });

    expect(
      mock.commandCalls(UpdateCommand)[0]?.args[0].input
        .ExpressionAttributeNames,
    ).toEqual({ '#count': 'recipes', '#ttl': 'ttl' });
  });

  it('should answer false when the limit was reached', async () => {
    const { client, mock, config } = createDynamo();
    mock.on(UpdateCommand).rejects(
      new ConditionalCheckFailedException({
        message: 'The conditional request failed',
        $metadata: {},
      }),
    );

    await expect(
      new DynamoUsageCounter(client, config).increment(INCREMENT),
    ).resolves.toBe(false);
  });

  it('should rethrow any other error', async () => {
    const { client, mock, config } = createDynamo();
    mock.on(UpdateCommand).rejects(new Error('throttled'));

    await expect(
      new DynamoUsageCounter(client, config).increment(INCREMENT),
    ).rejects.toThrow('throttled');
  });
});
