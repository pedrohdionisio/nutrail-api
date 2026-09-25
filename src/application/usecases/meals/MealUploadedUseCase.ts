import { FileStorage } from '@/application/ports/FileStorage';
import { MealProcessingQueue } from '@/application/ports/MealProcessingQueue';
import { MealRepository } from '@/application/ports/MealRepository';
import { mealFileKey } from '@/application/services/mealFiles';
import type { Meal } from '@/domain/entities/Meal';
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

    if (!meal) return;

    if (fileKey === meal.inputFileKey) {
      await this.enqueue(meal);

      return;
    }

    if (fileKey === mealFileKey('PICTURE', userId, mealId) && meal.isFinished) {
      meal.attachPicture(fileKey);
      await this.meals.update(meal);
    }
  }

  private async enqueue(meal: Meal): Promise<void> {
    if (meal.status === 'UPLOADING') {
      meal.markAsQueued();
      await this.meals.update(meal);
    }

    if (meal.status !== 'QUEUED') return;

    await this.queue.publish({ userId: meal.userId, mealId: meal.id });
  }
}
