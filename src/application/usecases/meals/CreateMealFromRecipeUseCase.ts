import { RecipeNotFoundError } from '@/application/errors/RecipeNotFoundError';
import { Clock } from '@/application/ports/Clock';
import { IdGenerator } from '@/application/ports/IdGenerator';
import { MealRepository } from '@/application/ports/MealRepository';
import { RecipeRepository } from '@/application/ports/RecipeRepository';
import { Meal } from '@/domain/entities/Meal';
import type { Language } from '@/domain/value-objects/Language';
import { Injectable } from '@/kernel/decorators/Injectable';

const SERVING_UNIT: Record<Language, string> = {
  'pt-BR': 'porção',
  'en-US': 'serving',
};

type Input = {
  userId: string;
  recipeId: string;
  date: string;
  time: string;
  language: Language;
};

@Injectable()
export class CreateMealFromRecipeUseCase {
  constructor(
    private readonly recipes: RecipeRepository,
    private readonly meals: MealRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute({
    userId,
    recipeId,
    date,
    time,
    language,
  }: Input): Promise<Meal> {
    const recipe = await this.recipes.findById(userId, recipeId);

    if (!recipe) {
      throw new RecipeNotFoundError();
    }

    const meal = new Meal({
      id: this.ids.generate(),
      userId,
      status: 'SUCCESS',
      inputType: 'MANUAL',
      inputFileKey: null,
      inputText: null,
      pictureKey: null,
      name: recipe.name,
      items: [
        {
          name: recipe.name,
          quantity: 1,
          unit: SERVING_UNIT[language],
          calories: recipe.calories,
          protein: recipe.protein,
          carbohydrate: recipe.carbohydrate,
          fat: recipe.fat,
        },
      ],
      attempts: 0,
      date,
      time,
      language,
      createdAt: this.clock.now().toISOString(),
    });

    await this.meals.create(meal);

    return meal;
  }
}
