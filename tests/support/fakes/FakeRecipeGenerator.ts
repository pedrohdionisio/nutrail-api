import type { RecipeGenerator } from '@/application/ports/RecipeGenerator';
import type { RecipeContent } from '@/domain/entities/Recipe';
import type { Goal } from '@/domain/entities/User';
import type { Macros } from '@/domain/value-objects/Macros';
import { buildRecipeContent } from '../fixtures/recipe';

export class FakeRecipeGenerator implements RecipeGenerator {
  recipe: RecipeContent = buildRecipeContent();
  error: Error | null = null;
  readonly calls: { text: string; goal: Goal; remaining: Macros }[] = [];

  async generate(input: {
    text: string;
    goal: Goal;
    remaining: Macros;
  }): Promise<RecipeContent> {
    this.calls.push(input);

    if (this.error) throw this.error;

    return structuredClone(this.recipe);
  }
}
