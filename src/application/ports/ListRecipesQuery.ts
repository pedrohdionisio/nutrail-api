import type { RecipeContent } from '@/domain/entities/Recipe';

export type RecipeDetails = RecipeContent & {
  id: string;
  createdAt: string;
};

export abstract class ListRecipesQuery {
  abstract execute(userId: string): Promise<RecipeDetails[]>;
}
