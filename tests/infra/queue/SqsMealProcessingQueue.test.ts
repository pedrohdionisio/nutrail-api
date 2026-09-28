import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { mockClient } from 'aws-sdk-client-mock';
import { describe, expect, it } from 'vitest';
import { SqsMealProcessingQueue } from '@/infra/queue/SqsMealProcessingQueue';
import { AppConfig } from '@/shared/config/AppConfig';

describe('SqsMealProcessingQueue', () => {
  it('should send the message as JSON to the meal queue', async () => {
    const client = new SQSClient({});
    const mock = mockClient(client);
    mock.on(SendMessageCommand).resolves({});

    await new SqsMealProcessingQueue(client, new AppConfig()).publish({
      userId: 'user-1',
      mealId: 'meal-1',
    });

    expect(mock.commandCalls(SendMessageCommand)[0]?.args[0].input).toEqual({
      QueueUrl: 'https://sqs.test/meal-processing',
      MessageBody: '{"userId":"user-1","mealId":"meal-1"}',
    });
  });
});
