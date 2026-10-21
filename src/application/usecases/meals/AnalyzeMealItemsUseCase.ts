import { MealAnalyzer } from '@/application/ports/MealAnalyzer';
import { DailyQuota } from '@/application/services/DailyQuota';
import type { MealItem } from '@/domain/entities/Meal';
import { MealWithoutItemsError } from '@/domain/errors/MealWithoutItemsError';
import type { Language } from '@/domain/value-objects/Language';
import { Injectable } from '@/kernel/decorators/Injectable';

type Input = {
  userId: string;
  text: string;
  language: Language;
};

@Injectable()
export class AnalyzeMealItemsUseCase {
  constructor(
    private readonly analyzer: MealAnalyzer,
    private readonly quota: DailyQuota,
  ) {}

  async execute({ userId, text, language }: Input): Promise<MealItem[]> {
    await this.quota.consume(userId, 'MEAL_ANALYSIS');

    const items = await this.analyzer.analyzeItems({ text, language });

    if (items.length === 0) {
      throw new MealWithoutItemsError();
    }

    return items;
  }
}
