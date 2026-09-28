import { ListSavedMealsController } from '@/presentation/controllers/savedMeals/ListSavedMealsController';
import { lambdaHttpAdapter } from '../adapters/lambdaHttpAdapter';

export const handler = lambdaHttpAdapter(ListSavedMealsController);
