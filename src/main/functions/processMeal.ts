import { ProcessMealConsumer } from '@/presentation/queue-consumers/ProcessMealConsumer';
import { lambdaSQSAdapter } from '../adapters/lambdaSQSAdapter';

export const handler = lambdaSQSAdapter(ProcessMealConsumer);
