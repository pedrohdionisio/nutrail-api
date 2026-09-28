import type { RecipeRepository } from '@/application/ports/RecipeRepository';
import type { Recipe } from '@/domain/entities/Recipe';
import { copyRecipe, type InMemoryDatabase } from './InMemoryDatabase';

export class InMemoryRecipeRepository implements RecipeRepository {
  constructor(private readonly db: InMemoryDatabase) {}

  async findById(userId: string, recipeId: string): Promise<Recipe | null> {
    const recipe = this.db.recipes.get(recipeId);

    return recipe?.userId === userId ? copyRecipe(recipe) : null;
  }

  async create(recipe: Recipe): Promise<void> {
    if (this.db.recipes.has(recipe.id)) {
      throw new Error(`Recipe ${recipe.id} already exists.`);
    }

    this.db.putRecipe(recipe);
  }

  async delete(userId: string, recipeId: string): Promise<boolean> {
    if (this.db.recipes.get(recipeId)?.userId !== userId) return false;

    return this.db.recipes.delete(recipeId);
  }
}
