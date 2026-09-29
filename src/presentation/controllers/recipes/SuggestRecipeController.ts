import { SuggestRecipeUseCase } from '@/application/usecases/recipes/SuggestRecipeUseCase';
import { Injectable } from '@/kernel/decorators/Injectable';
import { Schema } from '@/kernel/decorators/Schema';
import {
  Controller,
  type ControllerRequest,
  type ControllerResponse,
} from '../Controller';
import {
  type SuggestRecipeBody,
  suggestRecipeSchema,
} from './schemas/suggestRecipeSchema';

@Injectable()
@Schema(suggestRecipeSchema)
export class SuggestRecipeController extends Controller<
  'private',
  SuggestRecipeBody
> {
  constructor(private readonly suggestRecipe: SuggestRecipeUseCase) {
    super();
  }

  protected async handle({
    userId,
    body,
    language,
  }: ControllerRequest<
    'private',
    SuggestRecipeBody
  >): Promise<ControllerResponse> {
    const recipe = await this.suggestRecipe.execute({
      userId,
      ...body,
      language,
    });

    return { statusCode: 200, body: { recipe } };
  }
}
