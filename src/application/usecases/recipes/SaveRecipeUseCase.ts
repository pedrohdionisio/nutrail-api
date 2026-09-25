import { Clock } from '@/application/ports/Clock';
import { IdGenerator } from '@/application/ports/IdGenerator';
import { RecipeRepository } from '@/application/ports/RecipeRepository';
import { Recipe, type RecipeContent } from '@/domain/entities/Recipe';
import { Injectable } from '@/kernel/decorators/Injectable';

type Input = {
  userId: string;
  recipe: RecipeContent;
};

@Injectable()
export class SaveRecipeUseCase {
  constructor(
    private readonly recipes: RecipeRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute({ userId, recipe }: Input): Promise<Recipe> {
    const saved = new Recipe({
      ...recipe,
      id: this.ids.generate(),
      userId,
      createdAt: this.clock.now().toISOString(),
    });

    await this.recipes.create(saved);

    return saved;
  }
}
