import { SignInController } from '@/presentation/controllers/auth/SignInController';
import { lambdaHttpAdapter } from '../adapters/lambdaHttpAdapter';

export const handler = lambdaHttpAdapter(SignInController);
