import { ConfirmForgotPasswordController } from '@/presentation/controllers/auth/ConfirmForgotPasswordController';
import { lambdaHttpAdapter } from '../adapters/lambdaHttpAdapter';

export const handler = lambdaHttpAdapter(ConfirmForgotPasswordController);
