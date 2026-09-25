import { MealUploadedUseCase } from '@/application/usecases/meals/MealUploadedUseCase';
import { Injectable } from '@/kernel/decorators/Injectable';

@Injectable()
export class MealFileUploadedHandler {
  constructor(private readonly mealUploaded: MealUploadedUseCase) {}

  handle({ key }: { key: string }): Promise<void> {
    return this.mealUploaded.execute(key);
  }
}
