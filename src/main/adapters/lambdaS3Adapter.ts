import type { S3ObjectCreatedNotificationEvent } from 'aws-lambda';
import type { Token } from '@/kernel/di/Container';
import { container } from '../container';

type FileEventHandler = {
  handle(event: { key: string }): Promise<void>;
};

export function lambdaS3Adapter(handlerClass: Token<FileEventHandler>) {
  return async (event: S3ObjectCreatedNotificationEvent): Promise<void> => {
    await container.resolve(handlerClass).handle({
      key: event.detail.object.key,
    });
  };
}
