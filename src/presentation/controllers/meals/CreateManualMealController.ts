import { CreateManualMealUseCase } from '@/application/usecases/meals/CreateManualMealUseCase';
import { Injectable } from '@/kernel/decorators/Injectable';
import { Schema } from '@/kernel/decorators/Schema';
import {
  Controller,
  type ControllerRequest,
  type ControllerResponse,
} from '../Controller';
import {
  type CreateManualMealBody,
  createManualMealSchema,
} from './schemas/createManualMealSchema';

@Injectable()
@Schema(createManualMealSchema)
export class CreateManualMealController extends Controller<
  'private',
  CreateManualMealBody
> {
  constructor(private readonly createManualMeal: CreateManualMealUseCase) {
    super();
  }

  protected async handle({
    userId,
    body,
    language,
  }: ControllerRequest<
    'private',
    CreateManualMealBody
  >): Promise<ControllerResponse> {
    const meal = await this.createManualMeal.execute({
      userId,
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
        items: meal.items,
        ...meal.totals,
        createdAt: meal.createdAt,
      },
    };
  }
}
