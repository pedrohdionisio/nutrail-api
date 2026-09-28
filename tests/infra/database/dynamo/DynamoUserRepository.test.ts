import {
  BatchWriteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { describe, expect, it } from 'vitest';
import { DynamoUserRepository } from '@/infra/database/dynamo/DynamoUserRepository';
import { createDynamo, TABLE } from '../../../support/dynamo';
import { buildUser } from '../../../support/fixtures/user';

function setup() {
  const dynamo = createDynamo();

  return {
    ...dynamo,
    repository: new DynamoUserRepository(dynamo.client, dynamo.config),
  };
}

const ITEM = {
  PK: 'USER#user-1',
  SK: 'PROFILE',
  GSI1PK: 'COGNITO#sub-1',
  GSI1SK: 'PROFILE',
  id: 'user-1',
  externalId: 'sub-1',
  name: 'Ana Souza',
  email: 'ana@nutrail.test',
  gender: 'FEMALE',
  height: 165,
  weight: 60,
  goal: 'LOSE',
  birthDate: '1995-03-10',
  activityLevel: 'MODERATE',
  calories: 1800,
  protein: 120,
  carbohydrate: 204,
  fat: 54,
  createdAt: '2026-09-01T12:00:00.000Z',
};

function keysOf(count: number, offset = 0) {
  return Array.from({ length: count }, (_, index) => ({
    PK: 'USER#user-1',
    SK: `MEAL#${index + offset}`,
  }));
}

describe('DynamoUserRepository', () => {
  it('should create the profile with the Cognito index and the goals', async () => {
    const { mock, repository } = setup();
    mock.on(PutCommand).resolves({});

    await repository.create(buildUser());

    expect(mock.commandCalls(PutCommand)[0]?.args[0].input).toEqual({
      TableName: TABLE,
      Item: ITEM,
      ConditionExpression: 'attribute_not_exists(PK)',
    });
  });

  it('should update only an existing profile', async () => {
    const { mock, repository } = setup();
    mock.on(PutCommand).resolves({});

    await repository.update(buildUser());

    expect(
      mock.commandCalls(PutCommand)[0]?.args[0].input.ConditionExpression,
    ).toBe('attribute_exists(PK)');
  });

  it('should rebuild the user or return null', async () => {
    const { mock, repository } = setup();
    mock
      .on(GetCommand)
      .resolves({})
      .on(GetCommand, { Key: { PK: 'USER#user-1', SK: 'PROFILE' } })
      .resolves({ Item: ITEM });

    expect(await repository.findById('user-1')).toEqual(buildUser());
    expect(await repository.findById('missing')).toBeNull();
  });

  it('should delete every item of the user page by page, 25 per batch', async () => {
    const { mock, repository } = setup();
    mock
      .on(QueryCommand)
      .resolvesOnce({
        Items: keysOf(30),
        LastEvaluatedKey: { PK: 'USER#user-1', SK: 'MEAL#29' },
      })
      .resolvesOnce({ Items: keysOf(2, 30) });
    mock.on(BatchWriteCommand).resolves({});

    await repository.deleteWithAllData('user-1');

    const queries = mock
      .commandCalls(QueryCommand)
      .map(({ args }) => args[0].input);
    expect(queries[0]).toMatchObject({
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: { ':pk': 'USER#user-1' },
    });
    expect(queries[1]?.ExclusiveStartKey).toEqual({
      PK: 'USER#user-1',
      SK: 'MEAL#29',
    });
    const batches = mock
      .commandCalls(BatchWriteCommand)
      .map(({ args }) => args[0].input.RequestItems?.[TABLE]?.length);
    expect(batches).toEqual([25, 5, 2]);
  });

  it('should retry the items DynamoDB did not process', async () => {
    const { mock, repository } = setup();
    const first = { PK: 'USER#user-1', SK: 'MEAL#0' };
    const second = { PK: 'USER#user-1', SK: 'MEAL#1' };
    mock.on(QueryCommand).resolves({ Items: [first, second] });
    mock
      .on(BatchWriteCommand)
      .resolvesOnce({
        UnprocessedItems: { [TABLE]: [{ DeleteRequest: { Key: second } }] },
      })
      .resolves({});

    await repository.deleteWithAllData('user-1');

    const batches = mock
      .commandCalls(BatchWriteCommand)
      .map(({ args }) => args[0].input.RequestItems?.[TABLE]);
    expect(batches).toEqual([
      [{ DeleteRequest: { Key: first } }, { DeleteRequest: { Key: second } }],
      [{ DeleteRequest: { Key: second } }],
    ]);
  });
});
