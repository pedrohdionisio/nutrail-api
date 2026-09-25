import { MealNotFoundError } from '@/application/errors/MealNotFoundError';
import { FileStorage } from '@/application/ports/FileStorage';
import { MealRepository } from '@/application/ports/MealRepository';
import { Injectable } from '@/kernel/decorators/Injectable';

type Input = {
  userId: string;
  mealId: string;
};

@Injectable()
export class DeleteMealUseCase {
  constructor(
    private readonly meals: MealRepository,
    private readonly storage: FileStorage,
  ) {}

  async execute({ userId, mealId }: Input): Promise<void> {
    const meal = await this.meals.findById(userId, mealId);

    if (!meal) {
      throw new MealNotFoundError();
    }

    const fileKeys = new Set(
      [meal.inputFileKey, meal.pictureKey].filter((key) => key !== null),
    );

    await this.storage.deleteMany([...fileKeys]);
    await this.meals.delete(userId, mealId);
  }
}
