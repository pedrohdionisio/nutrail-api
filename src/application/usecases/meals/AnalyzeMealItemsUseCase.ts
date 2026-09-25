import { MealAnalyzer } from '@/application/ports/MealAnalyzer';
import type { MealItem } from '@/domain/entities/Meal';
import { MealWithoutItemsError } from '@/domain/errors/MealWithoutItemsError';
import { Injectable } from '@/kernel/decorators/Injectable';

@Injectable()
export class AnalyzeMealItemsUseCase {
  constructor(private readonly analyzer: MealAnalyzer) {}

  async execute(text: string): Promise<MealItem[]> {
    const items = await this.analyzer.analyzeItems(text);

    if (items.length === 0) {
      throw new MealWithoutItemsError();
    }

    return items;
  }
}
