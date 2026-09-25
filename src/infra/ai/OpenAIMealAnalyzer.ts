import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import type { ResponseInput } from 'openai/resources/responses/responses';
import { z } from 'zod';
import { MealAnalysisFailedError } from '@/application/errors/MealAnalysisFailedError';
import type { MealAnalyzer } from '@/application/ports/MealAnalyzer';
import type { MealAnalysis, MealItem } from '@/domain/entities/Meal';
import { Injectable } from '@/kernel/decorators/Injectable';
import { analyzeMealImagePrompt } from './prompts/analyzeMealImagePrompt';
import { analyzeMealItemsPrompt } from './prompts/analyzeMealItemsPrompt';
import { analyzeMealTextPrompt } from './prompts/analyzeMealTextPrompt';

const MODEL = 'gpt-6-luna';

const mealAnalysisSchema = z.object({
  name: z.string(),
  items: z.array(
    z.object({
      name: z.string(),
      quantity: z.number(),
      unit: z.string(),
      calories: z.number(),
      protein: z.number(),
      carbohydrate: z.number(),
      fat: z.number(),
    }),
  ),
});

@Injectable()
export class OpenAIMealAnalyzer implements MealAnalyzer {
  constructor(private readonly client: OpenAI) {}

  analyzeText({
    text,
    time,
  }: {
    text: string;
    time: string;
  }): Promise<MealAnalysis> {
    return this.analyze([
      { role: 'system', content: analyzeMealTextPrompt },
      {
        role: 'user',
        content: `Local time: ${time}\n\nMeal description:\n${text}`,
      },
    ]);
  }

  analyzeImage({
    imageUrl,
    time,
  }: {
    imageUrl: string;
    time: string;
  }): Promise<MealAnalysis> {
    return this.analyze([
      { role: 'system', content: analyzeMealImagePrompt },
      {
        role: 'user',
        content: [
          { type: 'input_text', text: `Local time: ${time}` },
          { type: 'input_image', image_url: imageUrl, detail: 'high' },
        ],
      },
    ]);
  }

  async analyzeItems(text: string): Promise<MealItem[]> {
    const { items } = await this.analyze([
      { role: 'system', content: analyzeMealItemsPrompt },
      { role: 'user', content: text },
    ]);

    return items;
  }

  private async analyze(input: ResponseInput): Promise<MealAnalysis> {
    const response = await this.client.responses.parse({
      model: MODEL,
      reasoning: { effort: 'low' },
      input,
      text: { format: zodTextFormat(mealAnalysisSchema, 'meal_analysis') },
    });

    if (!response.output_parsed) {
      console.error('Meal analysis returned no parsed output.', response.id);

      throw new MealAnalysisFailedError();
    }

    const { name, items } = response.output_parsed;

    return {
      name,
      items: items.map((item) => ({
        ...item,
        calories: Math.round(item.calories),
        protein: roundToTenth(item.protein),
        carbohydrate: roundToTenth(item.carbohydrate),
        fat: roundToTenth(item.fat),
      })),
    };
  }
}

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}
