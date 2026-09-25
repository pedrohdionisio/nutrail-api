import { ListRecipesController } from '@/presentation/controllers/recipes/ListRecipesController';
import { lambdaHttpAdapter } from '../adapters/lambdaHttpAdapter';

export const handler = lambdaHttpAdapter(ListRecipesController);
