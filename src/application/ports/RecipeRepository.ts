import type { Recipe } from '@/domain/entities/Recipe';

export abstract class RecipeRepository {
  abstract findById(userId: string, recipeId: string): Promise<Recipe | null>;

  abstract create(recipe: Recipe): Promise<void>;

  abstract delete(userId: string, recipeId: string): Promise<boolean>;
}
