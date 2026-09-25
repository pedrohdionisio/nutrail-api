import { MealFileUploadedHandler } from '@/presentation/file-events/MealFileUploadedHandler';
import { lambdaS3Adapter } from '../adapters/lambdaS3Adapter';

export const handler = lambdaS3Adapter(MealFileUploadedHandler);
