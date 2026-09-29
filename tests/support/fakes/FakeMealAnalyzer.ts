import type { MealAnalyzer } from '@/application/ports/MealAnalyzer';
import type { MealAnalysis, MealItem } from '@/domain/entities/Meal';
import type { Language } from '@/domain/value-objects/Language';
import { buildMealAnalysis } from '../fixtures/meal';

export class FakeMealAnalyzer implements MealAnalyzer {
  analysis: MealAnalysis = buildMealAnalysis();
  items: MealItem[] = buildMealAnalysis().items;
  error: Error | null = null;
  readonly textCalls: { text: string; time: string; language: Language }[] = [];
  readonly imageCalls: {
    imageUrl: string;
    time: string;
    language: Language;
  }[] = [];
  readonly itemsCalls: { text: string; language: Language }[] = [];

  async analyzeText(input: {
    text: string;
    time: string;
    language: Language;
  }): Promise<MealAnalysis> {
    this.textCalls.push(input);

    return this.respond(this.analysis);
  }

  async analyzeImage(input: {
    imageUrl: string;
    time: string;
    language: Language;
  }): Promise<MealAnalysis> {
    this.imageCalls.push(input);

    return this.respond(this.analysis);
  }

  async analyzeItems(input: {
    text: string;
    language: Language;
  }): Promise<MealItem[]> {
    this.itemsCalls.push(input);

    return this.respond(this.items);
  }

  private respond<T>(value: T): T {
    if (this.error) throw this.error;

    return structuredClone(value);
  }
}
