import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { AppConfig } from '@/shared/config/AppConfig';

export const TABLE = 'nutrail-test';

export function createDynamo() {
  const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

  return { client, mock: mockClient(client), config: new AppConfig() };
}
