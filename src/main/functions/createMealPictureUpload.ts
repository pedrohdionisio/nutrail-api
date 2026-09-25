import { CreateMealPictureUploadController } from '@/presentation/controllers/meals/CreateMealPictureUploadController';
import { lambdaHttpAdapter } from '../adapters/lambdaHttpAdapter';

export const handler = lambdaHttpAdapter(CreateMealPictureUploadController);
