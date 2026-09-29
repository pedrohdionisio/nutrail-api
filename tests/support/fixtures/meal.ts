import { Meal, type MealAnalysis, type MealItem } from '@/domain/entities/Meal';

type MealOverrides = Partial<ConstructorParameters<typeof Meal>[0]>;

export function buildMealItem(overrides: Partial<MealItem> = {}): MealItem {
  return {
    name: 'Arroz',
    quantity: 120,
    unit: 'g',
    calories: 156,
    protein: 3.1,
    carbohydrate: 34,
    fat: 0.3,
    ...overrides,
  };
}

export function buildMealAnalysis(
  overrides: Partial<MealAnalysis> = {},
): MealAnalysis {
  return {
    name: 'Almoço',
    items: [
      buildMealItem(),
      buildMealItem({
        name: 'Frango grelhado',
        quantity: 150,
        calories: 247,
        protein: 46.5,
        carbohydrate: 0,
        fat: 5.4,
      }),
    ],
    ...overrides,
  };
}

export function buildMeal(overrides: MealOverrides = {}): Meal {
  const analysis = buildMealAnalysis();

  return new Meal({
    id: 'meal-1',
    userId: 'user-1',
    status: 'SUCCESS',
    inputType: 'MANUAL',
    inputFileKey: null,
    inputText: '120 g de arroz e 150 g de frango grelhado',
    pictureKey: null,
    name: analysis.name,
    items: analysis.items,
    attempts: 1,
    date: '2026-09-26',
    time: '12:30',
    language: 'pt-BR',
    createdAt: '2026-09-26T15:30:00.000Z',
    ...overrides,
  });
}

export function buildPendingMeal(overrides: MealOverrides = {}): Meal {
  return buildMeal({
    status: 'UPLOADING',
    inputType: 'PICTURE',
    inputFileKey: 'pictures/user-1/meal-1.jpg',
    inputText: null,
    pictureKey: 'pictures/user-1/meal-1.jpg',
    name: null,
    items: [],
    attempts: 0,
    ...overrides,
  });
}
