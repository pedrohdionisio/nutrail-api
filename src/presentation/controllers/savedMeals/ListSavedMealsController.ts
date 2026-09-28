import { ListSavedMealsQuery } from '@/application/ports/ListSavedMealsQuery';
import { Injectable } from '@/kernel/decorators/Injectable';
import {
  Controller,
  type ControllerRequest,
  type ControllerResponse,
} from '../Controller';

@Injectable()
export class ListSavedMealsController extends Controller<'private'> {
  constructor(private readonly listSavedMeals: ListSavedMealsQuery) {
    super();
  }

  protected async handle({
    userId,
  }: ControllerRequest<'private'>): Promise<ControllerResponse> {
    const savedMeals = await this.listSavedMeals.execute(userId);

    return { statusCode: 200, body: { savedMeals } };
  }
}
