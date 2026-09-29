import { DeleteCommand, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { describe, expect, it } from 'vitest';
import { DynamoMealRepository } from '@/infra/database/dynamo/DynamoMealRepository';
import { createDynamo, TABLE } from '../../../support/dynamo';
import { buildMeal } from '../../../support/fixtures/meal';

function setup() {
  const dynamo = createDynamo();

  return {
    ...dynamo,
    repository: new DynamoMealRepository(dynamo.client, dynamo.config),
  };
}

const ITEM = {
  PK: 'USER#user-1',
  SK: 'MEAL#meal-1',
  GSI1PK: 'MEAL#user-1#2026-09-26',
  GSI1SK: 'MEAL#2026-09-26T15:30:00.000Z',
  id: 'meal-1',
  name: 'Almoço',
  items: buildMeal().items,
  calories: 403,
  protein: 49.6,
  carbohydrate: 34,
  fat: 5.7,
  status: 'SUCCESS',
  inputType: 'MANUAL',
  inputFileKey: null,
  inputText: '120 g de arroz e 150 g de frango grelhado',
  pictureKey: null,
  attempts: 1,
  date: '2026-09-26',
  time: '12:30',
  language: 'pt-BR',
  createdAt: '2026-09-26T15:30:00.000Z',
};

describe('DynamoMealRepository', () => {
  it('should create the meal with its keys, the day index and derived totals', async () => {
    const { mock, repository } = setup();
    mock.on(PutCommand).resolves({});

    await repository.create(buildMeal());

    expect(mock.commandCalls(PutCommand)[0]?.args[0].input).toEqual({
      TableName: TABLE,
      Item: ITEM,
      ConditionExpression: 'attribute_not_exists(PK)',
    });
  });

  it('should update only a meal that still exists, rewriting the day index', async () => {
    const { mock, repository } = setup();
    mock.on(PutCommand).resolves({});
    const meal = buildMeal();
    meal.edit({
      name: 'Jantar',
      items: [...meal.items],
      date: '2026-09-25',
      time: '20:00',
    });

    await repository.update(meal);

    expect(mock.commandCalls(PutCommand)[0]?.args[0].input).toMatchObject({
      Item: { GSI1PK: 'MEAL#user-1#2026-09-25', name: 'Jantar', time: '20:00' },
      ConditionExpression: 'attribute_exists(PK)',
    });
  });

  it('should rebuild the meal from the item', async () => {
    const { mock, repository } = setup();
    mock
      .on(GetCommand, {
        TableName: TABLE,
        Key: { PK: 'USER#user-1', SK: 'MEAL#meal-1' },
      })
      .resolves({
        Item: ITEM,
      });

    const meal = await repository.findById('user-1', 'meal-1');

    expect(meal).toEqual(buildMeal());
  });

  it('should read a meal stored before languages existed as Portuguese', async () => {
    const { mock, repository } = setup();
    const { language: _, ...legacyItem } = ITEM;
    mock.on(GetCommand).resolves({ Item: legacyItem });

    const meal = await repository.findById('user-1', 'meal-1');

    expect(meal?.language).toBe('pt-BR');
  });

  it('should return null when the meal does not exist', async () => {
    const { mock, repository } = setup();
    mock.on(GetCommand).resolves({});

    expect(await repository.findById('user-1', 'missing')).toBeNull();
  });

  it('should delete by the user and meal keys', async () => {
    const { mock, repository } = setup();
    mock.on(DeleteCommand).resolves({});

    await repository.delete('user-1', 'meal-1');

    expect(mock.commandCalls(DeleteCommand)[0]?.args[0].input).toEqual({
      TableName: TABLE,
      Key: { PK: 'USER#user-1', SK: 'MEAL#meal-1' },
    });
  });
});
