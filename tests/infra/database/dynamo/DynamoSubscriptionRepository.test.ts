import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { describe, expect, it } from 'vitest';
import { DynamoSubscriptionRepository } from '@/infra/database/dynamo/DynamoSubscriptionRepository';
import { createDynamo, TABLE } from '../../../support/dynamo';
import { buildSubscription } from '../../../support/fixtures/subscription';

function setup() {
  const dynamo = createDynamo();

  return {
    ...dynamo,
    repository: new DynamoSubscriptionRepository(dynamo.client, dynamo.config),
  };
}

describe('DynamoSubscriptionRepository', () => {
  it('should read the subscription item of the user', async () => {
    const { mock, repository } = setup();
    mock.on(GetCommand).resolves({
      Item: {
        PK: 'USER#user-1',
        SK: 'SUBSCRIPTION',
        customerId: 'cus_1',
        subscriptionId: 'sub_1',
        status: 'ACTIVE',
        cancelAt: '2026-10-26T15:00:00.000Z',
      },
    });

    expect(await repository.findByUserId('user-1')).toEqual(
      buildSubscription({ cancelAt: '2026-10-26T15:00:00.000Z' }),
    );
    expect(mock.commandCalls(GetCommand)[0]?.args[0].input).toEqual({
      TableName: TABLE,
      Key: { PK: 'USER#user-1', SK: 'SUBSCRIPTION' },
    });
  });

  it('should return null when the user never subscribed', async () => {
    const { mock, repository } = setup();
    mock.on(GetCommand).resolves({});

    expect(await repository.findByUserId('user-1')).toBeNull();
  });
});
