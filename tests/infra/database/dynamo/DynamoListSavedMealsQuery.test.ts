import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { describe, expect, it } from 'vitest';
import { DynamoListSavedMealsQuery } from '@/infra/database/dynamo/DynamoListSavedMealsQuery';
import { createDynamo } from '../../../support/dynamo';
import { buildMealItem } from '../../../support/fixtures/meal';

describe('DynamoListSavedMealsQuery', () => {
  it('should list the saved meals of the user from the newest, across pages', async () => {
    const { client, config, mock } = createDynamo();
    const savedMeal = {
      name: 'Almoço de sempre',
      items: [buildMealItem()],
      calories: 156,
      protein: 3.1,
      carbohydrate: 34,
      fat: 0.3,
      createdAt: '2026-09-25T15:00:00.000Z',
    };
    mock
      .on(QueryCommand)
      .resolvesOnce({
        Items: [{ ...savedMeal, id: 'b' }],
        LastEvaluatedKey: { PK: 'x' },
      })
      .resolvesOnce({ Items: [{ ...savedMeal, id: 'a' }] });

    const savedMeals = await new DynamoListSavedMealsQuery(
      client,
      config,
    ).execute('user-1');

    expect(savedMeals).toEqual([
      { ...savedMeal, id: 'b' },
      { ...savedMeal, id: 'a' },
    ]);
    expect(mock.commandCalls(QueryCommand)[0]?.args[0].input).toMatchObject({
      ExpressionAttributeValues: {
        ':pk': 'USER#user-1',
        ':prefix': 'SAVED_MEAL#',
      },
      ScanIndexForward: false,
    });
  });
});
