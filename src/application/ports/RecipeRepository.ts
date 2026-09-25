import type { Recipe } from '@/domain/entities/Recipe';

export abstract class RecipeRepository {
  abstract create(recipe: Recipe): Promise<void>;
}
