import { SaveRecipeController } from '@/presentation/controllers/recipes/SaveRecipeController';
import { lambdaHttpAdapter } from '../adapters/lambdaHttpAdapter';

export const handler = lambdaHttpAdapter(SaveRecipeController);
