import { UpdateMealController } from '@/presentation/controllers/meals/UpdateMealController';
import { lambdaHttpAdapter } from '../adapters/lambdaHttpAdapter';

export const handler = lambdaHttpAdapter(UpdateMealController);
