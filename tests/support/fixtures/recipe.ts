import { Recipe, type RecipeContent } from '@/domain/entities/Recipe';

type RecipeOverrides = Partial<ConstructorParameters<typeof Recipe>[0]>;

export function buildRecipeContent(
  overrides: Partial<RecipeContent> = {},
): RecipeContent {
  return {
    name: 'Omelete de queijo com tomate',
    ingredients: [
      { name: 'Ovo', quantity: 3, unit: 'unidades' },
      { name: 'Queijo mussarela', quantity: 40, unit: 'g' },
    ],
    instructions: '1. Bata os ovos.\n2. Junte o queijo e leve à frigideira.',
    calories: 420,
    protein: 30,
    carbohydrate: 6,
    fat: 30.5,
    ...overrides,
  };
}

export function buildRecipe(overrides: RecipeOverrides = {}): Recipe {
  return new Recipe({
    ...buildRecipeContent(),
    id: 'recipe-1',
    userId: 'user-1',
    createdAt: '2026-09-25T18:00:00.000Z',
    ...overrides,
  });
}
