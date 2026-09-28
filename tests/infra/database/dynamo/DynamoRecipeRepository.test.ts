import { DeleteCommand, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { describe, expect, it } from 'vitest';
import { DynamoRecipeRepository } from '@/infra/database/dynamo/DynamoRecipeRepository';
import { createDynamo, TABLE } from '../../../support/dynamo';
import {
  buildRecipe,
  buildRecipeContent,
} from '../../../support/fixtures/recipe';

function setup() {
  const dynamo = createDynamo();

  return {
    ...dynamo,
    repository: new DynamoRecipeRepository(dynamo.client, dynamo.config),
  };
}

const ITEM = {
  PK: 'USER#user-1',
  SK: 'RECIPE#recipe-1',
  id: 'recipe-1',
  ...buildRecipeContent(),
  createdAt: '2026-09-25T18:00:00.000Z',
};

describe('DynamoRecipeRepository', () => {
  it('should create the recipe under the user', async () => {
    const { mock, repository } = setup();
    mock.on(PutCommand).resolves({});

    await repository.create(buildRecipe());

    expect(mock.commandCalls(PutCommand)[0]?.args[0].input).toEqual({
      TableName: TABLE,
      Item: ITEM,
      ConditionExpression: 'attribute_not_exists(PK)',
    });
  });

  it('should rebuild the recipe or return null', async () => {
    const { mock, repository } = setup();
    mock
      .on(GetCommand, { Key: { PK: 'USER#user-1', SK: 'RECIPE#recipe-1' } })
      .resolves({ Item: ITEM })
      .on(GetCommand, { Key: { PK: 'USER#user-1', SK: 'RECIPE#missing' } })
      .resolves({});

    expect(await repository.findById('user-1', 'recipe-1')).toEqual(
      buildRecipe(),
    );
    expect(await repository.findById('user-1', 'missing')).toBeNull();
  });

  it('should tell whether something was deleted', async () => {
    const { mock, repository } = setup();
    mock
      .on(DeleteCommand, { Key: { PK: 'USER#user-1', SK: 'RECIPE#recipe-1' } })
      .resolves({ Attributes: ITEM })
      .on(DeleteCommand, { Key: { PK: 'USER#user-1', SK: 'RECIPE#missing' } })
      .resolves({});

    expect(await repository.delete('user-1', 'recipe-1')).toBe(true);
    expect(await repository.delete('user-1', 'missing')).toBe(false);
    expect(
      mock.commandCalls(DeleteCommand)[0]?.args[0].input.ReturnValues,
    ).toBe('ALL_OLD');
  });
});
