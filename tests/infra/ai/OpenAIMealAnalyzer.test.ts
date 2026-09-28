import OpenAI from 'openai';
import { describe, expect, it, vi } from 'vitest';
import { MealAnalysisFailedError } from '@/application/errors/MealAnalysisFailedError';
import { OpenAIMealAnalyzer } from '@/infra/ai/OpenAIMealAnalyzer';

const RAW_ANALYSIS = {
  name: 'Almoço',
  items: [
    {
      name: 'Arroz',
      quantity: 120,
      unit: 'g',
      calories: 156.4,
      protein: 3.14,
      carbohydrate: 34.06,
      fat: 0.33,
    },
  ],
};

function setup(outputParsed: unknown = RAW_ANALYSIS) {
  const client = new OpenAI({ apiKey: 'test' });
  const parse = vi
    .spyOn(client.responses, 'parse')
    .mockResolvedValue({ id: 'resp-1', output_parsed: outputParsed } as never);

  return { parse, analyzer: new OpenAIMealAnalyzer(client) };
}

describe('OpenAIMealAnalyzer', () => {
  it('should analyze a text with the local time and round the macros', async () => {
    const { parse, analyzer } = setup();

    const analysis = await analyzer.analyzeText({
      text: 'arroz',
      time: '12:30',
    });

    expect(analysis).toEqual({
      name: 'Almoço',
      items: [
        {
          name: 'Arroz',
          quantity: 120,
          unit: 'g',
          calories: 156,
          protein: 3.1,
          carbohydrate: 34.1,
          fat: 0.3,
        },
      ],
    });
    const request = parse.mock.calls[0]?.[0];
    expect(request).toMatchObject({
      model: 'gpt-6-luna',
      reasoning: { effort: 'low' },
    });
    expect(request?.input).toEqual([
      { role: 'system', content: expect.any(String) },
      {
        role: 'user',
        content: 'Local time: 12:30\n\nMeal description:\narroz',
      },
    ]);
  });

  it('should send the picture url in high detail', async () => {
    const { parse, analyzer } = setup();

    await analyzer.analyzeImage({
      imageUrl: 'https://files.test/meal.jpg',
      time: '08:00',
    });

    expect(parse.mock.calls[0]?.[0].input).toEqual([
      { role: 'system', content: expect.any(String) },
      {
        role: 'user',
        content: [
          { type: 'input_text', text: 'Local time: 08:00' },
          {
            type: 'input_image',
            image_url: 'https://files.test/meal.jpg',
            detail: 'high',
          },
        ],
      },
    ]);
  });

  it('should return only the items when analyzing items for an edit', async () => {
    const { analyzer } = setup();

    const items = await analyzer.analyzeItems('120 g de arroz');

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ name: 'Arroz', calories: 156 });
  });

  it('should fail when the model returns no parsed output', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { analyzer } = setup(null);

    await expect(
      analyzer.analyzeText({ text: 'arroz', time: '12:30' }),
    ).rejects.toThrow(MealAnalysisFailedError);
  });
});
