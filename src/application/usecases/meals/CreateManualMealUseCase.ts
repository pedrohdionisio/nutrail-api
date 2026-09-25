import { Clock } from '@/application/ports/Clock';
import { IdGenerator } from '@/application/ports/IdGenerator';
import { MealAnalyzer } from '@/application/ports/MealAnalyzer';
import { MealRepository } from '@/application/ports/MealRepository';
import { Meal } from '@/domain/entities/Meal';
import { Injectable } from '@/kernel/decorators/Injectable';

type Input = {
  userId: string;
  date: string;
  time: string;
  text: string;
};

@Injectable()
export class CreateManualMealUseCase {
  constructor(
    private readonly meals: MealRepository,
    private readonly analyzer: MealAnalyzer,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute({ userId, date, time, text }: Input): Promise<Meal> {
    const meal = new Meal({
      id: this.ids.generate(),
      userId,
      status: 'PROCESSING',
      inputType: 'MANUAL',
      inputFileKey: null,
      inputText: text,
      pictureKey: null,
      name: null,
      items: [],
      attempts: 1,
      date,
      createdAt: this.clock.now().toISOString(),
    });

    meal.complete(await this.analyzer.analyzeText({ text, time }));

    await this.meals.create(meal);

    return meal;
  }
}
