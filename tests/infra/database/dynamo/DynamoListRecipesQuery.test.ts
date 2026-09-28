import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { describe, expect, it } from 'vitest';
import { DynamoListRecipesQuery } from '@/infra/database/dynamo/DynamoListRecipesQuery';
import { createDynamo } from '../../../support/dynamo';
import { buildRecipeContent } from '../../../support/fixtures/recipe';

describe('DynamoListRecipesQuery', () => {
  it('should list the recipes of the user from the newest, across pages', async () => {
    const { client, config, mock } = createDynamo();
    const recipe = {
      ...buildRecipeContent(),
      createdAt: '2026-09-25T18:00:00.000Z',
    };
    mock
      .on(QueryCommand)
      .resolvesOnce({
        Items: [{ ...recipe, id: 'b' }],
        LastEvaluatedKey: { PK: 'x' },
      })
      .resolvesOnce({ Items: [{ ...recipe, id: 'a' }] });

    const recipes = await new DynamoListRecipesQuery(client, config).execute(
      'user-1',
    );

    expect(recipes).toEqual([
      { ...recipe, id: 'b' },
      { ...recipe, id: 'a' },
    ]);
    expect(mock.commandCalls(QueryCommand)[0]?.args[0].input).toMatchObject({
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
      ExpressionAttributeValues: { ':pk': 'USER#user-1', ':prefix': 'RECIPE#' },
      ScanIndexForward: false,
    });
  });
});
