import type { MealAnalysis, MealItem } from '@/domain/entities/Meal';
import type { Language } from '@/domain/value-objects/Language';

export abstract class MealAnalyzer {
  abstract analyzeText(input: {
    text: string;
    time: string;
    language: Language;
  }): Promise<MealAnalysis>;

  abstract analyzeImage(input: {
    imageUrl: string;
    time: string;
    language: Language;
  }): Promise<MealAnalysis>;

  abstract analyzeItems(input: {
    text: string;
    language: Language;
  }): Promise<MealItem[]>;
}
