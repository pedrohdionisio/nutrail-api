import { CreateMealController } from '@/presentation/controllers/meals/CreateMealController';
import { lambdaHttpAdapter } from '../adapters/lambdaHttpAdapter';

export const handler = lambdaHttpAdapter(CreateMealController);
