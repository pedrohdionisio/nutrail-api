import { ListMealsByDayController } from '@/presentation/controllers/meals/ListMealsByDayController';
import { lambdaHttpAdapter } from '../adapters/lambdaHttpAdapter';

export const handler = lambdaHttpAdapter(ListMealsByDayController);
