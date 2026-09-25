import { ForgotPasswordController } from '@/presentation/controllers/auth/ForgotPasswordController';
import { lambdaHttpAdapter } from '../adapters/lambdaHttpAdapter';

export const handler = lambdaHttpAdapter(ForgotPasswordController);
