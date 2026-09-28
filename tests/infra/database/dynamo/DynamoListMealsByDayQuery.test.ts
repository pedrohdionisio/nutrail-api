import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { describe, expect, it } from 'vitest';
import { DynamoListMealsByDayQuery } from '@/infra/database/dynamo/DynamoListMealsByDayQuery';
import { createDynamo, TABLE } from '../../../support/dynamo';

function setup() {
  const dynamo = createDynamo();

  return {
    ...dynamo,
    query: new DynamoListMealsByDayQuery(dynamo.client, dynamo.config),
  };
}

function item(overrides: Record<string, unknown>) {
  return {
    id: 'meal',
    name: 'Refeição',
    status: 'SUCCESS',
    inputType: 'MANUAL',
    time: '12:00',
    calories: 100,
    protein: 10,
    carbohydrate: 10,
    fat: 1,
    pictureKey: null,
    createdAt: '2026-09-26T15:00:00.000Z',
    ...overrides,
  };
}

describe('DynamoListMealsByDayQuery', () => {
  it('should query the day index without the meals still uploading', async () => {
    const { mock, query } = setup();
    mock.on(QueryCommand).resolves({ Items: [] });

    await query.execute({ userId: 'user-1', date: '2026-09-26' });

    expect(mock.commandCalls(QueryCommand)[0]?.args[0].input).toMatchObject({
      TableName: TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      FilterExpression: '#status <> :uploading',
      ExpressionAttributeValues: {
        ':pk': 'MEAL#user-1#2026-09-26',
        ':uploading': 'UPLOADING',
      },
    });
  });

  it('should read every page, sort by time then creation and total only analyzed meals', async () => {
    const { mock, query } = setup();
    mock
      .on(QueryCommand)
      .resolvesOnce({
        Items: [
          item({
            id: 'dinner',
            time: '20:00',
            calories: 600.4,
            protein: 30.26,
          }),
          item({
            id: 'lunch-b',
            time: '12:00',
            createdAt: '2026-09-26T15:10:00.000Z',
          }),
        ],
        LastEvaluatedKey: { PK: 'x' },
      })
      .resolvesOnce({
        Items: [
          item({
            id: 'lunch-a',
            time: '12:00',
            createdAt: '2026-09-26T15:05:00.000Z',
          }),
          item({
            id: 'failed',
            time: '09:00',
            status: 'FAILED',
            name: undefined,
            calories: 999,
          }),
        ],
      });

    const result = await query.execute({
      userId: 'user-1',
      date: '2026-09-26',
    });

    expect(result.meals.map(({ id }) => id)).toEqual([
      'failed',
      'lunch-a',
      'lunch-b',
      'dinner',
    ]);
    expect(result.meals[0]).toMatchObject({ name: null, pictureKey: null });
    expect(result.totals).toEqual({
      calories: 800,
      protein: 50.3,
      carbohydrate: 30,
      fat: 3,
    });
    expect(
      mock.commandCalls(QueryCommand)[1]?.args[0].input.ExclusiveStartKey,
    ).toEqual({ PK: 'x' });
  });
});
