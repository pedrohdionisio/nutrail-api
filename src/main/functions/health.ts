import { HealthController } from '@/presentation/controllers/HealthController';
import { lambdaHttpAdapter } from '../adapters/lambdaHttpAdapter';

export const handler = lambdaHttpAdapter(HealthController);
