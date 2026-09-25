import { DeleteRecipeController } from '@/presentation/controllers/recipes/DeleteRecipeController';
import { lambdaHttpAdapter } from '../adapters/lambdaHttpAdapter';

export const handler = lambdaHttpAdapter(DeleteRecipeController);
