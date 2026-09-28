import { SavedMeal } from '@/domain/entities/SavedMeal';
import { buildMealAnalysis } from './meal';

type SavedMealOverrides = Partial<ConstructorParameters<typeof SavedMeal>[0]>;

export function buildSavedMeal(overrides: SavedMealOverrides = {}): SavedMeal {
  return new SavedMeal({
    id: 'saved-1',
    userId: 'user-1',
    name: 'Almoço de sempre',
    items: buildMealAnalysis().items,
    createdAt: '2026-09-25T15:00:00.000Z',
    ...overrides,
  });
}
