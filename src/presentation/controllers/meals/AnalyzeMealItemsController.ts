import { AnalyzeMealItemsUseCase } from '@/application/usecases/meals/AnalyzeMealItemsUseCase';
import { Injectable } from '@/kernel/decorators/Injectable';
import { Schema } from '@/kernel/decorators/Schema';
import {
  Controller,
  type ControllerRequest,
  type ControllerResponse,
} from '../Controller';
import {
  type AnalyzeMealItemsBody,
  analyzeMealItemsSchema,
} from './schemas/analyzeMealItemsSchema';

@Injectable()
@Schema(analyzeMealItemsSchema)
export class AnalyzeMealItemsController extends Controller<
  'private',
  AnalyzeMealItemsBody
> {
  constructor(private readonly analyzeMealItems: AnalyzeMealItemsUseCase) {
    super();
  }

  protected async handle({
    body,
  }: ControllerRequest<
    'private',
    AnalyzeMealItemsBody
  >): Promise<ControllerResponse> {
    const items = await this.analyzeMealItems.execute(body.text);

    return { statusCode: 200, body: { items } };
  }
}
