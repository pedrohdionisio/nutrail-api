import { ChangePasswordController } from '@/presentation/controllers/me/ChangePasswordController';
import { lambdaHttpAdapter } from '../adapters/lambdaHttpAdapter';

export const handler = lambdaHttpAdapter(ChangePasswordController);
