import { CreateManualMealController } from '@/presentation/controllers/meals/CreateManualMealController';
import { lambdaHttpAdapter } from '../adapters/lambdaHttpAdapter';

export const handler = lambdaHttpAdapter(CreateManualMealController);
