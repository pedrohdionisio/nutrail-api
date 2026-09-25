import { SaveRecipeUseCase } from '@/application/usecases/recipes/SaveRecipeUseCase';
import { Injectable } from '@/kernel/decorators/Injectable';
import { Schema } from '@/kernel/decorators/Schema';
import {
  Controller,
  type ControllerRequest,
  type ControllerResponse,
} from '../Controller';
import {
  type SaveRecipeBody,
  saveRecipeSchema,
} from './schemas/saveRecipeSchema';

@Injectable()
@Schema(saveRecipeSchema)
export class SaveRecipeController extends Controller<
  'private',
  SaveRecipeBody
> {
  constructor(private readonly saveRecipe: SaveRecipeUseCase) {
    super();
  }

  protected async handle({
    userId,
    body,
  }: ControllerRequest<
    'private',
    SaveRecipeBody
  >): Promise<ControllerResponse> {
    const recipe = await this.saveRecipe.execute({ userId, recipe: body });

    return {
      statusCode: 201,
      body: {
        id: recipe.id,
        name: recipe.name,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        calories: recipe.calories,
        protein: recipe.protein,
        carbohydrate: recipe.carbohydrate,
        fat: recipe.fat,
        createdAt: recipe.createdAt,
      },
    };
  }
}
