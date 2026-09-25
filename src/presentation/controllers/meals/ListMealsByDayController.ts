import { ListMealsByDayQuery } from '@/application/ports/ListMealsByDayQuery';
import { Injectable } from '@/kernel/decorators/Injectable';
import {
  Controller,
  type ControllerRequest,
  type ControllerResponse,
} from '../Controller';
import { listMealsByDaySchema } from './schemas/listMealsByDaySchema';

@Injectable()
export class ListMealsByDayController extends Controller<'private'> {
  constructor(private readonly listMealsByDay: ListMealsByDayQuery) {
    super();
  }

  protected async handle({
    userId,
    queryParams,
  }: ControllerRequest<'private'>): Promise<ControllerResponse> {
    const { date } = listMealsByDaySchema.parse(queryParams);
    const { meals, totals } = await this.listMealsByDay.execute({
      userId,
      date,
    });

    return { statusCode: 200, body: { date, meals, totals } };
  }
}
