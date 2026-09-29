import { MealAnalyzer } from '@/application/ports/MealAnalyzer';
import type { MealItem } from '@/domain/entities/Meal';
import { MealWithoutItemsError } from '@/domain/errors/MealWithoutItemsError';
import type { Language } from '@/domain/value-objects/Language';
import { Injectable } from '@/kernel/decorators/Injectable';

@Injectable()
export class AnalyzeMealItemsUseCase {
  constructor(private readonly analyzer: MealAnalyzer) {}

  async execute(input: {
    text: string;
    language: Language;
  }): Promise<MealItem[]> {
    const items = await this.analyzer.analyzeItems(input);

    if (items.length === 0) {
      throw new MealWithoutItemsError();
    }

    return items;
  }
}
