import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { describe, expect, it } from 'vitest';
import { DynamoGetMealQuery } from '@/infra/database/dynamo/DynamoGetMealQuery';
import { createDynamo, TABLE } from '../../../support/dynamo';
import { buildMealItem } from '../../../support/fixtures/meal';

function setup() {
  const dynamo = createDynamo();

  return {
    ...dynamo,
    query: new DynamoGetMealQuery(dynamo.client, dynamo.config),
  };
}

const DETAILS = {
  id: 'meal-1',
  name: 'Almoço',
  status: 'SUCCESS',
  inputType: 'PICTURE',
  date: '2026-09-26',
  time: '12:30',
  items: [buildMealItem()],
  calories: 156,
  protein: 3.1,
  carbohydrate: 34,
  fat: 0.3,
  pictureKey: 'pictures/user-1/meal-1.jpg',
  createdAt: '2026-09-26T15:30:00.000Z',
};

describe('DynamoGetMealQuery', () => {
  it('should read only the attributes the screen needs', async () => {
    const { mock, query } = setup();
    mock.on(GetCommand).resolves({ Item: DETAILS });

    expect(await query.execute({ userId: 'user-1', mealId: 'meal-1' })).toEqual(
      DETAILS,
    );

    const input = mock.commandCalls(GetCommand)[0]?.args[0].input;
    expect(input).toMatchObject({
      TableName: TABLE,
      Key: { PK: 'USER#user-1', SK: 'MEAL#meal-1' },
    });
    expect(Object.values(input?.ExpressionAttributeNames ?? {})).not.toContain(
      'inputText',
    );
  });

  it('should return a null picture for items without one', async () => {
    const { mock, query } = setup();
    const { pictureKey: _, ...withoutPicture } = DETAILS;
    mock.on(GetCommand).resolves({ Item: withoutPicture });

    expect(
      await query.execute({ userId: 'user-1', mealId: 'meal-1' }),
    ).toMatchObject({
      pictureKey: null,
    });
  });

  it('should return null when the meal does not exist', async () => {
    const { mock, query } = setup();
    mock.on(GetCommand).resolves({});

    expect(
      await query.execute({ userId: 'user-1', mealId: 'meal-1' }),
    ).toBeNull();
  });
});
