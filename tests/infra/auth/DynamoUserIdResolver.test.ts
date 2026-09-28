import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { describe, expect, it } from 'vitest';
import { DynamoUserIdResolver } from '@/infra/auth/DynamoUserIdResolver';
import { createDynamo } from '../../support/dynamo';

function setup() {
  const dynamo = createDynamo();

  return {
    ...dynamo,
    resolver: new DynamoUserIdResolver(dynamo.client, dynamo.config),
  };
}

describe('DynamoUserIdResolver', () => {
  it('should find the user id by the Cognito sub and cache it', async () => {
    const { mock, resolver } = setup();
    mock.on(QueryCommand).resolves({ Items: [{ id: 'user-1' }] });

    expect(await resolver.resolve('sub-1')).toBe('user-1');
    expect(await resolver.resolve('sub-1')).toBe('user-1');

    expect(mock.commandCalls(QueryCommand)).toHaveLength(1);
    expect(mock.commandCalls(QueryCommand)[0]?.args[0].input).toMatchObject({
      IndexName: 'GSI1',
      ExpressionAttributeValues: { ':pk': 'COGNITO#sub-1', ':sk': 'PROFILE' },
      Limit: 1,
    });
  });

  it('should retry while the index has not caught up with a new sign-up', async () => {
    const { mock, resolver } = setup();
    mock
      .on(QueryCommand)
      .resolvesOnce({ Items: [] })
      .resolvesOnce({ Items: [{ id: 'user-1' }] });

    expect(await resolver.resolve('sub-1')).toBe('user-1');
    expect(mock.commandCalls(QueryCommand)).toHaveLength(2);
  });

  it('should give up after three tries without caching the miss', async () => {
    const { mock, resolver } = setup();
    mock.on(QueryCommand).resolves({ Items: [] });

    expect(await resolver.resolve('sub-unknown')).toBeNull();
    expect(mock.commandCalls(QueryCommand)).toHaveLength(3);
  });
});
