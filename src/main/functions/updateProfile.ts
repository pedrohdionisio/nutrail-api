import { UpdateProfileController } from '@/presentation/controllers/profile/UpdateProfileController';
import { lambdaHttpAdapter } from '../adapters/lambdaHttpAdapter';

export const handler = lambdaHttpAdapter(UpdateProfileController);
