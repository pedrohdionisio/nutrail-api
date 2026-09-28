import type {
  MealProcessingMessage,
  MealProcessingQueue,
} from '@/application/ports/MealProcessingQueue';

export class FakeMealProcessingQueue implements MealProcessingQueue {
  readonly published: MealProcessingMessage[] = [];

  async publish(message: MealProcessingMessage): Promise<void> {
    this.published.push(message);
  }
}
