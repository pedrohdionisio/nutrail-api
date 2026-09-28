import { describe, expect, it } from 'vitest';
import { AnalyzeMealItemsUseCase } from '@/application/usecases/meals/AnalyzeMealItemsUseCase';
import { MealWithoutItemsError } from '@/domain/errors/MealWithoutItemsError';
import { createFakes } from '../../../support/fakes/createFakes';
import { buildMealItem } from '../../../support/fixtures/meal';

describe('AnalyzeMealItemsUseCase', () => {
  it('should return the items analyzed from the text', async () => {
    const f = createFakes();
    f.analyzer.items = [
      buildMealItem({ name: 'Azeite', quantity: 2, unit: 'colheres de sopa' }),
    ];

    const items = await new AnalyzeMealItemsUseCase(f.analyzer).execute(
      '2 colheres de azeite',
    );

    expect(items).toEqual(f.analyzer.items);
    expect(f.analyzer.itemsCalls).toEqual(['2 colheres de azeite']);
  });

  it('should refuse a text without food', async () => {
    const f = createFakes();
    f.analyzer.items = [];

    await expect(
      new AnalyzeMealItemsUseCase(f.analyzer).execute('uma cadeira'),
    ).rejects.toThrow(MealWithoutItemsError);
  });
});
