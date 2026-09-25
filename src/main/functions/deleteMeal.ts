import { DeleteMealController } from '@/presentation/controllers/meals/DeleteMealController';
import { lambdaHttpAdapter } from '../adapters/lambdaHttpAdapter';

export const handler = lambdaHttpAdapter(DeleteMealController);
