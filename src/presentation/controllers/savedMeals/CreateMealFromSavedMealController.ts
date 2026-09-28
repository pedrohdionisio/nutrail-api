import { SavedMealNotFoundError } from '@/application/errors/SavedMealNotFoundError';
import { CreateMealFromSavedMealUseCase } from '@/application/usecases/meals/CreateMealFromSavedMealUseCase';
import { Injectable } from '@/kernel/decorators/Injectable';
import { Schema } from '@/kernel/decorators/Schema';
import {
  Controller,
  type ControllerRequest,
  type ControllerResponse,
} from '../Controller';
import {
  type CreateMealFromSavedMealBody,
  createMealFromSavedMealSchema,
} from './schemas/createMealFromSavedMealSchema';

@Injectable()
@Schema(createMealFromSavedMealSchema)
export class CreateMealFromSavedMealController extends Controller<
  'private',
  CreateMealFromSavedMealBody
> {
  constructor(
    private readonly createMealFromSavedMeal: CreateMealFromSavedMealUseCase,
  ) {
    super();
  }

  protected async handle({
    userId,
    params,
    body,
  }: ControllerRequest<
    'private',
    CreateMealFromSavedMealBody
  >): Promise<ControllerResponse> {
    if (!params.savedMealId) {
      throw new SavedMealNotFoundError();
    }

    const meal = await this.createMealFromSavedMeal.execute({
      userId,
      savedMealId: params.savedMealId,
      ...body,
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
