import { FileStorage } from '@/application/ports/FileStorage';
import { MealAnalyzer } from '@/application/ports/MealAnalyzer';
import type { MealProcessingMessage } from '@/application/ports/MealProcessingQueue';
import { MealRepository } from '@/application/ports/MealRepository';
import { Transcriber } from '@/application/ports/Transcriber';
import type { Meal, MealAnalysis } from '@/domain/entities/Meal';
import { DomainError } from '@/domain/errors/DomainError';
import { Injectable } from '@/kernel/decorators/Injectable';

const MAX_ATTEMPTS = 3;

@Injectable()
export class ProcessMealUseCase {
  constructor(
    private readonly meals: MealRepository,
    private readonly storage: FileStorage,
    private readonly analyzer: MealAnalyzer,
    private readonly transcriber: Transcriber,
  ) {}

  async execute({ userId, mealId }: MealProcessingMessage): Promise<void> {
    const meal = await this.meals.findById(userId, mealId);

    if (meal?.status !== 'QUEUED') return;

    meal.markAsProcessing();
    await this.meals.update(meal);

    try {
      meal.complete(await this.analyze(meal));
    } catch (error) {
      const retryable =
        !(error instanceof DomainError) && meal.attempts < MAX_ATTEMPTS;

      if (retryable) {
        meal.requeue();
        await this.meals.update(meal);

        throw error;
      }

      console.error(`Meal ${mealId} failed processing.`, error);
      meal.fail();
    }

    await this.meals.update(meal);
  }

  private async analyze(meal: Meal): Promise<MealAnalysis> {
    if (meal.inputType === 'PICTURE') {
      return this.analyzer.analyzeImage({
        imageUrl: await this.fileUrl(meal),
        time: meal.time,
      });
    }

    const text =
      meal.inputText ??
      (await this.transcriber.transcribe(await this.fileUrl(meal)));

    meal.recordTranscription(text);

    return this.analyzer.analyzeText({ text, time: meal.time });
  }

  private fileUrl(meal: Meal): Promise<string> {
    if (!meal.inputFileKey) {
      throw new Error(`Meal ${meal.id} has no input file.`);
    }

    return this.storage.getReadUrl(meal.inputFileKey);
  }
}
