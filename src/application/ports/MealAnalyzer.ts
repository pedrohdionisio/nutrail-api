import type { MealAnalysis, MealItem } from '@/domain/entities/Meal';

export abstract class MealAnalyzer {
  abstract analyzeText(input: {
    text: string;
    time: string;
  }): Promise<MealAnalysis>;

  abstract analyzeImage(input: {
    imageUrl: string;
    time: string;
  }): Promise<MealAnalysis>;

  abstract analyzeItems(text: string): Promise<MealItem[]>;
}
