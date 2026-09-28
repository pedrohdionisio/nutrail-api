import { SavedMealNotFoundError } from '@/application/errors/SavedMealNotFoundError';
import { DeleteSavedMealUseCase } from '@/application/usecases/savedMeals/DeleteSavedMealUseCase';
import { Injectable } from '@/kernel/decorators/Injectable';
import {
  Controller,
  type ControllerRequest,
  type ControllerResponse,
} from '../Controller';

@Injectable()
export class DeleteSavedMealController extends Controller<'private'> {
  constructor(private readonly deleteSavedMeal: DeleteSavedMealUseCase) {
    super();
  }

  protected async handle({
    userId,
    params,
  }: ControllerRequest<'private'>): Promise<ControllerResponse> {
    if (!params.savedMealId) {
      throw new SavedMealNotFoundError();
    }

    await this.deleteSavedMeal.execute({
      userId,
      savedMealId: params.savedMealId,
    });

    return { statusCode: 204 };
  }
}
