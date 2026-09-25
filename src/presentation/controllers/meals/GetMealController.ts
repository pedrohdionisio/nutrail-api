import { MealNotFoundError } from '@/application/errors/MealNotFoundError';
import { FileStorage } from '@/application/ports/FileStorage';
import { GetMealQuery } from '@/application/ports/GetMealQuery';
import { Injectable } from '@/kernel/decorators/Injectable';
import {
  Controller,
  type ControllerRequest,
  type ControllerResponse,
} from '../Controller';

@Injectable()
export class GetMealController extends Controller<'private'> {
  constructor(
    private readonly getMeal: GetMealQuery,
    private readonly storage: FileStorage,
  ) {
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
      throw new MealNotFoundError();
    }

    const { pictureKey, ...details } = meal;

    const pictureUrl = pictureKey
      ? await this.storage.getReadUrl(pictureKey)
      : null;

    return { statusCode: 200, body: { ...details, pictureUrl } };
  }
}
