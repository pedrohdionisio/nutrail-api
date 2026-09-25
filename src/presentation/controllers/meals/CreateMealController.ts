import { CreateMealUseCase } from '@/application/usecases/meals/CreateMealUseCase';
import { Injectable } from '@/kernel/decorators/Injectable';
import { Schema } from '@/kernel/decorators/Schema';
import {
  Controller,
  type ControllerRequest,
  type ControllerResponse,
} from '../Controller';
import {
  type CreateMealBody,
  createMealSchema,
} from './schemas/createMealSchema';

@Injectable()
@Schema(createMealSchema)
export class CreateMealController extends Controller<
  'private',
  CreateMealBody
> {
  constructor(private readonly createMeal: CreateMealUseCase) {
    super();
  }

  protected async handle({
    userId,
    body,
  }: ControllerRequest<
    'private',
    CreateMealBody
  >): Promise<ControllerResponse> {
    const result = await this.createMeal.execute({ userId, ...body });

    return { statusCode: 201, body: result };
  }
}
