import { NoFoodIngredientsError } from '@/application/errors/NoFoodIngredientsError';
import { UserNotFoundError } from '@/application/errors/UserNotFoundError';
import { GetProfileQuery } from '@/application/ports/GetProfileQuery';
import { ListMealsByDayQuery } from '@/application/ports/ListMealsByDayQuery';
import { RecipeGenerator } from '@/application/ports/RecipeGenerator';
import type { RecipeContent } from '@/domain/entities/Recipe';
import type { Macros } from '@/domain/value-objects/Macros';
import { Injectable } from '@/kernel/decorators/Injectable';

type Input = {
  userId: string;
  date: string;
  text: string;
};

@Injectable()
export class SuggestRecipeUseCase {
  constructor(
    private readonly getProfile: GetProfileQuery,
    private readonly listMealsByDay: ListMealsByDayQuery,
    private readonly generator: RecipeGenerator,
  ) {}

  async execute({ userId, date, text }: Input): Promise<RecipeContent> {
    const [me, day] = await Promise.all([
      this.getProfile.execute(userId),
      this.listMealsByDay.execute({ userId, date }),
    ]);

    if (!me) {
      throw new UserNotFoundError();
    }

    const recipe = await this.generator.generate({
      text,
      goal: me.profile.goal,
      remaining: remainingOf(me.goals, day.totals),
    });

    if (recipe.ingredients.length === 0) {
      throw new NoFoodIngredientsError();
    }

    return recipe;
  }
}

function remainingOf(goals: Macros, consumed: Macros): Macros {
  const left = (key: keyof Macros) =>
    Math.max(0, Math.round((goals[key] - consumed[key]) * 10) / 10);

  return {
    calories: Math.round(left('calories')),
    protein: left('protein'),
    carbohydrate: left('carbohydrate'),
    fat: left('fat'),
  };
}
