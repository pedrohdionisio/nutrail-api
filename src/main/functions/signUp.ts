import { SignUpController } from '@/presentation/controllers/auth/SignUpController';
import { lambdaHttpAdapter } from '../adapters/lambdaHttpAdapter';

export const handler = lambdaHttpAdapter(SignUpController);
