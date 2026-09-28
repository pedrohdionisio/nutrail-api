import { DeleteCommand, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { describe, expect, it } from 'vitest';
import { DynamoSavedMealRepository } from '@/infra/database/dynamo/DynamoSavedMealRepository';
import { createDynamo, TABLE } from '../../../support/dynamo';
import { buildSavedMeal } from '../../../support/fixtures/savedMeal';

function setup() {
  const dynamo = createDynamo();

  return {
    ...dynamo,
    repository: new DynamoSavedMealRepository(dynamo.client, dynamo.config),
  };
}

const ITEM = {
  PK: 'USER#user-1',
  SK: 'SAVED_MEAL#saved-1',
  id: 'saved-1',
  name: 'Almoço de sempre',
  items: buildSavedMeal().items,
  calories: 403,
  protein: 49.6,
  carbohydrate: 34,
  fat: 5.7,
  createdAt: '2026-09-25T15:00:00.000Z',
};

describe('DynamoSavedMealRepository', () => {
  it('should create the saved meal with derived totals', async () => {
    const { mock, repository } = setup();
    mock.on(PutCommand).resolves({});

    await repository.create(buildSavedMeal());

    expect(mock.commandCalls(PutCommand)[0]?.args[0].input).toEqual({
      TableName: TABLE,
      Item: ITEM,
      ConditionExpression: 'attribute_not_exists(PK)',
    });
  });

  it('should rebuild the saved meal or return null', async () => {
    const { mock, repository } = setup();
    mock
      .on(GetCommand, { Key: { PK: 'USER#user-1', SK: 'SAVED_MEAL#saved-1' } })
      .resolves({ Item: ITEM })
      .on(GetCommand, { Key: { PK: 'USER#user-1', SK: 'SAVED_MEAL#missing' } })
      .resolves({});

    expect(await repository.findById('user-1', 'saved-1')).toEqual(
      buildSavedMeal(),
    );
    expect(await repository.findById('user-1', 'missing')).toBeNull();
  });

  it('should tell whether something was deleted', async () => {
    const { mock, repository } = setup();
    mock
      .on(DeleteCommand)
      .resolves({})
      .on(DeleteCommand, {
        Key: { PK: 'USER#user-1', SK: 'SAVED_MEAL#saved-1' },
      })
      .resolves({ Attributes: ITEM });

    expect(await repository.delete('user-1', 'saved-1')).toBe(true);
    expect(await repository.delete('user-1', 'missing')).toBe(false);
  });
});
