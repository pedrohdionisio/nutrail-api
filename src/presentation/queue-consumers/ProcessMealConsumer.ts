import { ProcessMealUseCase } from '@/application/usecases/meals/ProcessMealUseCase';
import { Injectable } from '@/kernel/decorators/Injectable';
import { mealProcessingMessageSchema } from './schemas/mealProcessingMessageSchema';

@Injectable()
export class ProcessMealConsumer {
  constructor(private readonly processMeal: ProcessMealUseCase) {}

  handle(message: unknown): Promise<void> {
    return this.processMeal.execute(mealProcessingMessageSchema.parse(message));
  }
}
