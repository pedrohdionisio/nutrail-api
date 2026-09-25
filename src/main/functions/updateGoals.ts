import { UpdateGoalsController } from '@/presentation/controllers/goals/UpdateGoalsController';
import { lambdaHttpAdapter } from '../adapters/lambdaHttpAdapter';

export const handler = lambdaHttpAdapter(UpdateGoalsController);
