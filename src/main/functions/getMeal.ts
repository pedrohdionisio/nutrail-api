import { GetMealController } from '@/presentation/controllers/meals/GetMealController';
import { lambdaHttpAdapter } from '../adapters/lambdaHttpAdapter';

export const handler = lambdaHttpAdapter(GetMealController);
