import { RecipeNotFoundError } from '@/application/errors/RecipeNotFoundError';
import { DeleteRecipeUseCase } from '@/application/usecases/recipes/DeleteRecipeUseCase';
import { Injectable } from '@/kernel/decorators/Injectable';
import {
  Controller,
  type ControllerRequest,
  type ControllerResponse,
} from '../Controller';

@Injectable()
export class DeleteRecipeController extends Controller<'private'> {
  constructor(private readonly deleteRecipe: DeleteRecipeUseCase) {
    super();
  }

  protected async handle({
    userId,
    params,
  }: ControllerRequest<'private'>): Promise<ControllerResponse> {
    if (!params.recipeId) {
      throw new RecipeNotFoundError();
    }

    await this.deleteRecipe.execute({ userId, recipeId: params.recipeId });

    return { statusCode: 204 };
  }
}
