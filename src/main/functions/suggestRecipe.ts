import { SuggestRecipeController } from '@/presentation/controllers/recipes/SuggestRecipeController';
import { lambdaHttpAdapter } from '../adapters/lambdaHttpAdapter';

export const handler = lambdaHttpAdapter(SuggestRecipeController);
