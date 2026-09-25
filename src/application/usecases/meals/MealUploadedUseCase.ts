import { FileStorage } from '@/application/ports/FileStorage';
import { MealProcessingQueue } from '@/application/ports/MealProcessingQueue';
import { MealRepository } from '@/application/ports/MealRepository';
import { Injectable } from '@/kernel/decorators/Injectable';

@Injectable()
export class MealUploadedUseCase {
  constructor(
    private readonly meals: MealRepository,
    private readonly storage: FileStorage,
    private readonly queue: MealProcessingQueue,
  ) {}

  async execute(fileKey: string): Promise<void> {
    const { userid: userId, mealid: mealId } =
      await this.storage.getMetadata(fileKey);

    if (!userId || !mealId) return;

    const meal = await this.meals.findById(userId, mealId);

    if (!meal || meal.inputFileKey !== fileKey) return;

    if (meal.status === 'UPLOADING') {
      meal.markAsQueued();
      await this.meals.update(meal);
    }

    if (meal.status !== 'QUEUED') return;

    await this.queue.publish({ userId, mealId });
  }
}
