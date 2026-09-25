import type { SQSBatchResponse, SQSEvent } from 'aws-lambda';
import type { Token } from '@/kernel/di/Container';
import { container } from '../container';

type QueueConsumer = {
  handle(message: unknown): Promise<void>;
};

export function lambdaSQSAdapter(consumerClass: Token<QueueConsumer>) {
  return async (event: SQSEvent): Promise<SQSBatchResponse> => {
    const consumer = container.resolve(consumerClass);

    const results = await Promise.allSettled(
      event.Records.map(async (record) =>
        consumer.handle(JSON.parse(record.body)),
      ),
    );

    const batchItemFailures = event.Records.flatMap((record, index) => {
      const result = results[index];

      if (result?.status !== 'rejected') return [];

      console.error(`Message ${record.messageId} failed.`, result.reason);

      return [{ itemIdentifier: record.messageId }];
    });

    return { batchItemFailures };
  };
}
