import { AnalyzeMealItemsController } from '@/presentation/controllers/meals/AnalyzeMealItemsController';
import { lambdaHttpAdapter } from '../adapters/lambdaHttpAdapter';

export const handler = lambdaHttpAdapter(AnalyzeMealItemsController);
