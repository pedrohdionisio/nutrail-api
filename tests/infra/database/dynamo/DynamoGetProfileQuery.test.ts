import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { describe, expect, it } from 'vitest';
import { DynamoGetProfileQuery } from '@/infra/database/dynamo/DynamoGetProfileQuery';
import { createDynamo } from '../../../support/dynamo';

function setup() {
  const dynamo = createDynamo();

  return {
    ...dynamo,
    query: new DynamoGetProfileQuery(dynamo.client, dynamo.config),
  };
}

describe('DynamoGetProfileQuery', () => {
  it('should split the profile item into profile and goals', async () => {
    const { mock, query } = setup();
    mock
      .on(GetCommand, { Key: { PK: 'USER#user-1', SK: 'PROFILE' } })
      .resolves({
        Item: {
          name: 'Ana Souza',
          email: 'ana@nutrail.test',
          gender: 'FEMALE',
          birthDate: '1995-03-10',
          height: 165,
          weight: 60,
          goal: 'LOSE',
          activityLevel: 'MODERATE',
          calories: 1800,
          protein: 120,
          carbohydrate: 204,
          fat: 54,
        },
      });

    expect(await query.execute('user-1')).toEqual({
      profile: {
        name: 'Ana Souza',
        email: 'ana@nutrail.test',
        gender: 'FEMALE',
        birthDate: '1995-03-10',
        height: 165,
        weight: 60,
        goal: 'LOSE',
        activityLevel: 'MODERATE',
      },
      goals: { calories: 1800, protein: 120, carbohydrate: 204, fat: 54 },
    });
  });

  it('should return null when the user does not exist', async () => {
    const { mock, query } = setup();
    mock.on(GetCommand).resolves({});

    expect(await query.execute('missing')).toBeNull();
  });
});
