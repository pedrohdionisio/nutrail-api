import { MealNotFoundError } from '@/application/errors/MealNotFoundError';
import { ReprocessMealUseCase } from '@/application/usecases/meals/ReprocessMealUseCase';
import { Injectable } from '@/kernel/decorators/Injectable';
import {
  Controller,
  type ControllerRequest,
  type ControllerResponse,
} from '../Controller';

@Injectable()
export class ReprocessMealController extends Controller<'private'> {
  constructor(private readonly reprocessMeal: ReprocessMealUseCase) {
    super();
  }

  protected async handle({
    userId,
    params,
  }: ControllerRequest<'private'>): Promise<ControllerResponse> {
    if (!params.mealId) {
      throw new MealNotFoundError();
    }

    const meal = await this.reprocessMeal.execute({
      userId,
      mealId: params.mealId,
    });

    return { statusCode: 202, body: { id: meal.id, status: meal.status } };
  }
}
