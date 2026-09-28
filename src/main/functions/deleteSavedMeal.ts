import { DeleteSavedMealController } from '@/presentation/controllers/savedMeals/DeleteSavedMealController';
import { lambdaHttpAdapter } from '../adapters/lambdaHttpAdapter';

export const handler = lambdaHttpAdapter(DeleteSavedMealController);
