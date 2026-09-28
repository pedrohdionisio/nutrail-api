import type { MealAnalyzer } from '@/application/ports/MealAnalyzer';
import type { MealAnalysis, MealItem } from '@/domain/entities/Meal';
import { buildMealAnalysis } from '../fixtures/meal';

export class FakeMealAnalyzer implements MealAnalyzer {
  analysis: MealAnalysis = buildMealAnalysis();
  items: MealItem[] = buildMealAnalysis().items;
  error: Error | null = null;
  readonly textCalls: { text: string; time: string }[] = [];
  readonly imageCalls: { imageUrl: string; time: string }[] = [];
  readonly itemsCalls: string[] = [];

  async analyzeText(input: {
    text: string;
    time: string;
  }): Promise<MealAnalysis> {
    this.textCalls.push(input);

    return this.respond(this.analysis);
  }

  async analyzeImage(input: {
    imageUrl: string;
    time: string;
  }): Promise<MealAnalysis> {
    this.imageCalls.push(input);

    return this.respond(this.analysis);
  }

  async analyzeItems(text: string): Promise<MealItem[]> {
    this.itemsCalls.push(text);

    return this.respond(this.items);
  }

  private respond<T>(value: T): T {
    if (this.error) throw this.error;

    return structuredClone(value);
  }
}
