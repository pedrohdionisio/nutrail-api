import { RecipeNotFoundError } from '@/application/errors/RecipeNotFoundError';
import { CreateMealFromRecipeUseCase } from '@/application/usecases/meals/CreateMealFromRecipeUseCase';
import { Injectable } from '@/kernel/decorators/Injectable';
import { Schema } from '@/kernel/decorators/Schema';
import {
  Controller,
  type ControllerRequest,
  type ControllerResponse,
} from '../Controller';
import {
  type CreateMealFromRecipeBody,
  createMealFromRecipeSchema,
} from './schemas/createMealFromRecipeSchema';

@Injectable()
@Schema(createMealFromRecipeSchema)
export class CreateMealFromRecipeController extends Controller<
  'private',
  CreateMealFromRecipeBody
> {
  constructor(
    private readonly createMealFromRecipe: CreateMealFromRecipeUseCase,
  ) {
    super();
  }

  protected async handle({
    userId,
    params,
    body,
    language,
  }: ControllerRequest<
    'private',
    CreateMealFromRecipeBody
  >): Promise<ControllerResponse> {
    if (!params.recipeId) {
      throw new RecipeNotFoundError();
    }

    const meal = await this.createMealFromRecipe.execute({
      userId,
      recipeId: params.recipeId,
      ...body,
      language,
    });

    return {
      statusCode: 201,
      body: {
        id: meal.id,
        name: meal.name,
        status: meal.status,
        inputType: meal.inputType,
        date: meal.date,
        time: meal.time,
        items: meal.items,
        ...meal.totals,
        createdAt: meal.createdAt,
      },
    };
  }
}
