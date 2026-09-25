import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import type {
  MealProcessingMessage,
  MealProcessingQueue,
} from '@/application/ports/MealProcessingQueue';
import { Injectable } from '@/kernel/decorators/Injectable';
import { AppConfig } from '@/shared/config/AppConfig';

@Injectable()
export class SqsMealProcessingQueue implements MealProcessingQueue {
  constructor(
    private readonly client: SQSClient,
    private readonly config: AppConfig,
  ) {}

  async publish(message: MealProcessingMessage): Promise<void> {
    await this.client.send(
      new SendMessageCommand({
        QueueUrl: this.config.mealQueueUrl,
        MessageBody: JSON.stringify(message),
      }),
    );
  }
}
