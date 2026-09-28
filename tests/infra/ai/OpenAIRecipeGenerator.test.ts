import OpenAI from 'openai';
import { describe, expect, it, vi } from 'vitest';
import { RecipeGenerationFailedError } from '@/application/errors/RecipeGenerationFailedError';
import { OpenAIRecipeGenerator } from '@/infra/ai/OpenAIRecipeGenerator';
import { buildRecipeContent } from '../../support/fixtures/recipe';

function setup(outputParsed: unknown) {
  const client = new OpenAI({ apiKey: 'test' });
  const parse = vi
    .spyOn(client.responses, 'parse')
    .mockResolvedValue({ id: 'resp-1', output_parsed: outputParsed } as never);

  return { parse, generator: new OpenAIRecipeGenerator(client) };
}

const INPUT = {
  text: 'tenho ovos e queijo',
  goal: 'LOSE' as const,
  remaining: { calories: 800, protein: 50.5, carbohydrate: 90, fat: 20 },
};

describe('OpenAIRecipeGenerator', () => {
  it('should send the goal and what is left of the day and round the macros', async () => {
    const { parse, generator } = setup({
      ...buildRecipeContent(),
      calories: 419.6,
      protein: 30.04,
      carbohydrate: 5.96,
      fat: 30.45,
    });

    const recipe = await generator.generate(INPUT);

    expect(recipe).toEqual({
      ...buildRecipeContent(),
      calories: 420,
      protein: 30,
      carbohydrate: 6,
      fat: 30.5,
    });
    expect(parse.mock.calls[0]?.[0].input).toEqual([
      { role: 'system', content: expect.any(String) },
      {
        role: 'user',
        content:
          'Goal: LOSE\nLeft for today: 800 kcal, 50.5 g protein, 90 g carbohydrate, 20 g fat\n\nUser request:\ntenho ovos e queijo',
      },
    ]);
  });

  it('should fail when the model returns no recipe', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { generator } = setup(null);

    await expect(generator.generate(INPUT)).rejects.toThrow(
      RecipeGenerationFailedError,
    );
  });
});
