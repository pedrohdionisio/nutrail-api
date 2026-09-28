import type {
  GetMealQuery,
  MealDetails,
} from '@/application/ports/GetMealQuery';
import type {
  GetProfileQuery,
  ProfileWithGoals,
} from '@/application/ports/GetProfileQuery';
import type {
  ListMealsByDayQuery,
  MealsOfDay,
} from '@/application/ports/ListMealsByDayQuery';
import type {
  ListRecipesQuery,
  RecipeDetails,
} from '@/application/ports/ListRecipesQuery';
import type {
  ListSavedMealsQuery,
  SavedMealDetails,
} from '@/application/ports/ListSavedMealsQuery';
import type { UserIdResolver } from '@/application/ports/UserIdResolver';
import { sumMacros } from '@/domain/value-objects/Macros';
import type { InMemoryDatabase } from './InMemoryDatabase';

function newestFirst<T extends { createdAt: string; id: string }>(
  a: T,
  b: T,
): number {
  return b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id);
}

export class InMemoryGetProfileQuery implements GetProfileQuery {
  constructor(private readonly db: InMemoryDatabase) {}

  async execute(userId: string): Promise<ProfileWithGoals | null> {
    const user = this.db.users.get(userId);

    if (!user) return null;

    return {
      profile: {
        name: user.name,
        email: user.email,
        gender: user.gender,
        birthDate: user.birthDate,
        height: user.height,
        weight: user.weight,
        goal: user.goal,
        activityLevel: user.activityLevel,
      },
      goals: { ...user.goals },
    };
  }
}

export class InMemoryGetMealQuery implements GetMealQuery {
  constructor(private readonly db: InMemoryDatabase) {}

  async execute({
    userId,
    mealId,
  }: {
    userId: string;
    mealId: string;
  }): Promise<MealDetails | null> {
    const meal = this.db.meals.get(mealId);

    if (meal?.userId !== userId) return null;

    return {
      id: meal.id,
      name: meal.name,
      status: meal.status,
      inputType: meal.inputType,
      date: meal.date,
      time: meal.time,
      items: meal.items.map((item) => ({ ...item })),
      ...meal.totals,
      pictureKey: meal.pictureKey,
      createdAt: meal.createdAt,
    };
  }
}

export class InMemoryListMealsByDayQuery implements ListMealsByDayQuery {
  constructor(private readonly db: InMemoryDatabase) {}

  async execute({
    userId,
    date,
  }: {
    userId: string;
    date: string;
  }): Promise<MealsOfDay> {
    const meals = [...this.db.meals.values()]
      .filter(
        (meal) =>
          meal.userId === userId &&
          meal.date === date &&
          meal.status !== 'UPLOADING',
      )
      .sort(
        (a, b) =>
          a.time.localeCompare(b.time) ||
          a.createdAt.localeCompare(b.createdAt),
      )
      .map((meal) => ({
        id: meal.id,
        name: meal.name,
        status: meal.status,
        inputType: meal.inputType,
        time: meal.time,
        ...meal.totals,
        pictureKey: meal.pictureKey,
        createdAt: meal.createdAt,
      }));

    return {
      meals,
      totals: sumMacros(meals.filter(({ status }) => status === 'SUCCESS')),
    };
  }
}

export class InMemoryListRecipesQuery implements ListRecipesQuery {
  constructor(private readonly db: InMemoryDatabase) {}

  async execute(userId: string): Promise<RecipeDetails[]> {
    return [...this.db.recipes.values()]
      .filter((recipe) => recipe.userId === userId)
      .sort(newestFirst)
      .map(({ userId: _, ...recipe }) => ({
        ...recipe,
        ingredients: recipe.ingredients.map((ingredient) => ({
          ...ingredient,
        })),
      }));
  }
}

export class InMemoryListSavedMealsQuery implements ListSavedMealsQuery {
  constructor(private readonly db: InMemoryDatabase) {}

  async execute(userId: string): Promise<SavedMealDetails[]> {
    return [...this.db.savedMeals.values()]
      .filter((savedMeal) => savedMeal.userId === userId)
      .sort(newestFirst)
      .map((savedMeal) => ({
        id: savedMeal.id,
        name: savedMeal.name,
        items: savedMeal.items.map((item) => ({ ...item })),
        ...savedMeal.totals,
        createdAt: savedMeal.createdAt,
      }));
  }
}

export class InMemoryUserIdResolver implements UserIdResolver {
  constructor(private readonly db: InMemoryDatabase) {}

  async resolve(externalId: string): Promise<string | null> {
    for (const user of this.db.users.values()) {
      if (user.externalId === externalId) return user.id;
    }

    return null;
  }
}
