import { MealNotFoundError } from '@/application/errors/MealNotFoundError';
import { CreateMealPictureUploadUseCase } from '@/application/usecases/meals/CreateMealPictureUploadUseCase';
import { Injectable } from '@/kernel/decorators/Injectable';
import {
  Controller,
  type ControllerRequest,
  type ControllerResponse,
} from '../Controller';

@Injectable()
export class CreateMealPictureUploadController extends Controller<'private'> {
  constructor(
    private readonly createMealPictureUpload: CreateMealPictureUploadUseCase,
  ) {
    super();
  }

  protected async handle({
    userId,
    params,
  }: ControllerRequest<'private'>): Promise<ControllerResponse> {
    if (!params.mealId) {
      throw new MealNotFoundError();
    }

    const upload = await this.createMealPictureUpload.execute({
      userId,
      mealId: params.mealId,
    });

    return { statusCode: 200, body: { upload } };
  }
}
