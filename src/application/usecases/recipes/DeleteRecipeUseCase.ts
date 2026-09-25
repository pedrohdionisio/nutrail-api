import { RecipeNotFoundError } from '@/application/errors/RecipeNotFoundError';
import { RecipeRepository } from '@/application/ports/RecipeRepository';
import { Injectable } from '@/kernel/decorators/Injectable';

type Input = {
  userId: string;
  recipeId: string;
};

@Injectable()
export class DeleteRecipeUseCase {
  constructor(private readonly recipes: RecipeRepository) {}

  async execute({ userId, recipeId }: Input): Promise<void> {
    const deleted = await this.recipes.delete(userId, recipeId);

    if (!deleted) {
      throw new RecipeNotFoundError();
    }
  }
}
