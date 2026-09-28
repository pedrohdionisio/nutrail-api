import { CreateMealFromSavedMealController } from '@/presentation/controllers/savedMeals/CreateMealFromSavedMealController';
import { lambdaHttpAdapter } from '../adapters/lambdaHttpAdapter';

export const handler = lambdaHttpAdapter(CreateMealFromSavedMealController);
