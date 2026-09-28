import { MealNotFoundError } from '@/application/errors/MealNotFoundError';
import { UpdateMealUseCase } from '@/application/usecases/meals/UpdateMealUseCase';
import { Injectable } from '@/kernel/decorators/Injectable';
import { Schema } from '@/kernel/decorators/Schema';
import {
  Controller,
  type ControllerRequest,
  type ControllerResponse,
} from '../Controller';
import {
  type UpdateMealBody,
  updateMealSchema,
} from './schemas/updateMealSchema';

@Injectable()
@Schema(updateMealSchema)
export class UpdateMealController extends Controller<
  'private',
  UpdateMealBody
> {
  constructor(private readonly updateMeal: UpdateMealUseCase) {
    super();
  }

  protected async handle({
    userId,
    params,
    body,
  }: ControllerRequest<
    'private',
    UpdateMealBody
  >): Promise<ControllerResponse> {
    if (!params.mealId) {
      throw new MealNotFoundError();
    }

    const meal = await this.updateMeal.execute({
      userId,
      mealId: params.mealId,
      ...body,
    });

    return {
      statusCode: 200,
      body: {
        name: meal.name,
        items: meal.items,
        date: meal.date,
        time: meal.time,
        ...meal.totals,
      },
    };
  }
}
