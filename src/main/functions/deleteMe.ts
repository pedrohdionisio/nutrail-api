import { DeleteMeController } from '@/presentation/controllers/me/DeleteMeController';
import { lambdaHttpAdapter } from '../adapters/lambdaHttpAdapter';

export const handler = lambdaHttpAdapter(DeleteMeController);
