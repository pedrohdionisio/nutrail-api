import { beforeEach, describe, expect, it } from 'vitest';
import { DailyLimitReachedError } from '@/application/errors/DailyLimitReachedError';
import { DailyQuota } from '@/application/services/DailyQuota';
import { AnalyzeMealItemsUseCase } from '@/application/usecases/meals/AnalyzeMealItemsUseCase';
import { MealWithoutItemsError } from '@/domain/errors/MealWithoutItemsError';
import { createFakes, type Fakes } from '../../../support/fakes/createFakes';
import { exhaustDailyLimit } from '../../../support/fakes/InMemoryUsageCounter';
import { buildMealItem } from '../../../support/fixtures/meal';

describe('AnalyzeMealItemsUseCase', () => {
  let f: Fakes;
  let analyzeMealItems: AnalyzeMealItemsUseCase;

  beforeEach(() => {
    f = createFakes();
    analyzeMealItems = new AnalyzeMealItemsUseCase(
      f.analyzer,
      new DailyQuota(f.usage, f.subscriptions, f.clock),
    );
  });

  it('should return the items analyzed from the text', async () => {
    f.analyzer.items = [
      buildMealItem({ name: 'Azeite', quantity: 2, unit: 'colheres de sopa' }),
    ];

    const items = await analyzeMealItems.execute({
      userId: 'user-1',
      text: '2 colheres de azeite',
      language: 'en-US',
    });

    expect(items).toEqual(f.analyzer.items);
    expect(f.analyzer.itemsCalls).toEqual([
      { text: '2 colheres de azeite', language: 'en-US' },
    ]);
    expect(f.db.usage.get('user-1#2026-09-26#MEAL_ANALYSIS')).toBe(1);
  });

  it('should refuse when the daily limit was reached, without analyzing', async () => {
    exhaustDailyLimit(f.db, 'user-1', 'MEAL_ANALYSIS');

    await expect(
      analyzeMealItems.execute({
        userId: 'user-1',
        text: '2 colheres de azeite',
        language: 'pt-BR',
      }),
    ).rejects.toThrow(DailyLimitReachedError);
    expect(f.analyzer.itemsCalls).toEqual([]);
  });

  it('should refuse a text without food', async () => {
    f.analyzer.items = [];

    await expect(
      analyzeMealItems.execute({
        userId: 'user-1',
        text: 'uma cadeira',
        language: 'pt-BR',
      }),
    ).rejects.toThrow(MealWithoutItemsError);
  });
});
