import { RefreshTokenController } from '@/presentation/controllers/auth/RefreshTokenController';
import { lambdaHttpAdapter } from '../adapters/lambdaHttpAdapter';

export const handler = lambdaHttpAdapter(RefreshTokenController);
