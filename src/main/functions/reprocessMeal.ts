import { ReprocessMealController } from '@/presentation/controllers/meals/ReprocessMealController';
import { lambdaHttpAdapter } from '../adapters/lambdaHttpAdapter';

export const handler = lambdaHttpAdapter(ReprocessMealController);
