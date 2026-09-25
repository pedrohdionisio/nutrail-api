import { MealNotFoundError } from '@/application/errors/MealNotFoundError';
import { DeleteMealUseCase } from '@/application/usecases/meals/DeleteMealUseCase';
import { Injectable } from '@/kernel/decorators/Injectable';
import {
  Controller,
  type ControllerRequest,
  type ControllerResponse,
} from '../Controller';

@Injectable()
export class DeleteMealController extends Controller<'private'> {
  constructor(private readonly deleteMeal: DeleteMealUseCase) {
    super();
  }

  protected async handle({
    userId,
    params,
  }: ControllerRequest<'private'>): Promise<ControllerResponse> {
    if (!params.mealId) {
      throw new MealNotFoundError();
    }

    await this.deleteMeal.execute({ userId, mealId: params.mealId });

    return { statusCode: 204 };
  }
}
