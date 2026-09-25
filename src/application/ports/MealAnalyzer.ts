import type { MealAnalysis } from '@/domain/entities/Meal';

export abstract class MealAnalyzer {
  abstract analyzeText(input: {
    text: string;
    time: string;
  }): Promise<MealAnalysis>;
}
