import { SaveMealController } from '@/presentation/controllers/savedMeals/SaveMealController';
import { lambdaHttpAdapter } from '../adapters/lambdaHttpAdapter';

export const handler = lambdaHttpAdapter(SaveMealController);
