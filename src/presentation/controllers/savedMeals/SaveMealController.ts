import { SaveMealUseCase } from '@/application/usecases/savedMeals/SaveMealUseCase';
import { Injectable } from '@/kernel/decorators/Injectable';
import { Schema } from '@/kernel/decorators/Schema';
import {
  Controller,
  type ControllerRequest,
  type ControllerResponse,
} from '../Controller';
import { type SaveMealBody, saveMealSchema } from './schemas/saveMealSchema';

@Injectable()
@Schema(saveMealSchema)
export class SaveMealController extends Controller<'private', SaveMealBody> {
  constructor(private readonly saveMeal: SaveMealUseCase) {
    super();
  }

  protected async handle({
    userId,
    body,
  }: ControllerRequest<'private', SaveMealBody>): Promise<ControllerResponse> {
    const savedMeal = await this.saveMeal.execute({ userId, ...body });

    return {
      statusCode: 201,
      body: {
        id: savedMeal.id,
        name: savedMeal.name,
        items: savedMeal.items,
        ...savedMeal.totals,
        createdAt: savedMeal.createdAt,
      },
    };
  }
}
