import { GetMealQuery } from '@/application/ports/GetMealQuery';
import { Injectable } from '@/kernel/decorators/Injectable';
import { HttpError } from '@/presentation/errors/HttpError';
import {
  Controller,
  type ControllerRequest,
  type ControllerResponse,
} from '../Controller';

@Injectable()
export class GetMealController extends Controller<'private'> {
  constructor(private readonly getMeal: GetMealQuery) {
    super();
  }

  protected async handle({
    userId,
    params,
  }: ControllerRequest<'private'>): Promise<ControllerResponse> {
    const meal = params.mealId
      ? await this.getMeal.execute({ userId, mealId: params.mealId })
      : null;

    if (!meal) {
      throw new HttpError(404, 'MEAL_NOT_FOUND', 'Meal not found.');
    }

    return { statusCode: 200, body: meal };
  }
}
