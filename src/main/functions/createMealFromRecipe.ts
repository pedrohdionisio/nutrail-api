import { CreateMealFromRecipeController } from '@/presentation/controllers/recipes/CreateMealFromRecipeController';
import { lambdaHttpAdapter } from '../adapters/lambdaHttpAdapter';

export const handler = lambdaHttpAdapter(CreateMealFromRecipeController);
