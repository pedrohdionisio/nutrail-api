import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { RecipeGenerationFailedError } from '@/application/errors/RecipeGenerationFailedError';
import type { RecipeGenerator } from '@/application/ports/RecipeGenerator';
import type { RecipeContent } from '@/domain/entities/Recipe';
import type { Goal } from '@/domain/entities/User';
import type { Language } from '@/domain/value-objects/Language';
import type { Macros } from '@/domain/value-objects/Macros';
import { Injectable } from '@/kernel/decorators/Injectable';
import { outputLanguage } from './prompts/outputLanguage';
import { suggestRecipePrompt } from './prompts/suggestRecipePrompt';

const MODEL = 'gpt-6-luna';

const recipeSchema = z.object({
  name: z.string(),
  ingredients: z.array(
    z.object({
      name: z.string(),
      quantity: z.number(),
      unit: z.string(),
    }),
  ),
  instructions: z.string(),
  calories: z.number(),
  protein: z.number(),
  carbohydrate: z.number(),
  fat: z.number(),
});

@Injectable()
export class OpenAIRecipeGenerator implements RecipeGenerator {
  constructor(private readonly client: OpenAI) {}

  async generate({
    text,
    goal,
    remaining,
    language,
  }: {
    text: string;
    goal: Goal;
    remaining: Macros;
    language: Language;
  }): Promise<RecipeContent> {
    const response = await this.client.responses.parse({
      model: MODEL,
      reasoning: { effort: 'low' },
      input: [
        { role: 'system', content: suggestRecipePrompt },
        {
          role: 'user',
          content: [
            outputLanguage(language),
            `Goal: ${goal}`,
            `Left for today: ${describe(remaining)}`,
            '',
            'User request:',
            text,
          ].join('\n'),
        },
      ],
      text: { format: zodTextFormat(recipeSchema, 'recipe') },
    });

    const recipe = response.output_parsed;

    if (!recipe) {
      console.error('Recipe generation returned no recipe.', response.id);

      throw new RecipeGenerationFailedError();
    }

    return {
      ...recipe,
      calories: Math.round(recipe.calories),
      protein: roundToTenth(recipe.protein),
      carbohydrate: roundToTenth(recipe.carbohydrate),
      fat: roundToTenth(recipe.fat),
    };
  }
}

function describe({ calories, protein, carbohydrate, fat }: Macros): string {
  return `${calories} kcal, ${protein} g protein, ${carbohydrate} g carbohydrate, ${fat} g fat`;
}

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}
