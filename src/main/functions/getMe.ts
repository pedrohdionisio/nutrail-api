import { GetMeController } from '@/presentation/controllers/me/GetMeController';
import { lambdaHttpAdapter } from '../adapters/lambdaHttpAdapter';

export const handler = lambdaHttpAdapter(GetMeController);
