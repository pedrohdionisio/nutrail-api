import { ListRecipesQuery } from '@/application/ports/ListRecipesQuery';
import { Injectable } from '@/kernel/decorators/Injectable';
import {
  Controller,
  type ControllerRequest,
  type ControllerResponse,
} from '../Controller';

@Injectable()
export class ListRecipesController extends Controller<'private'> {
  constructor(private readonly listRecipes: ListRecipesQuery) {
    super();
  }

  protected async handle({
    userId,
  }: ControllerRequest<'private'>): Promise<ControllerResponse> {
    const recipes = await this.listRecipes.execute(userId);

    return { statusCode: 200, body: { recipes } };
  }
}
