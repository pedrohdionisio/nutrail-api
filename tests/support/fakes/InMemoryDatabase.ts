import { Meal } from '@/domain/entities/Meal';
import { Recipe } from '@/domain/entities/Recipe';
import { SavedMeal } from '@/domain/entities/SavedMeal';
import { User } from '@/domain/entities/User';

export class InMemoryDatabase {
  readonly users = new Map<string, User>();
  readonly meals = new Map<string, Meal>();
  readonly recipes = new Map<string, Recipe>();
  readonly savedMeals = new Map<string, SavedMeal>();

  putUser(user: User): void {
    this.users.set(user.id, copyUser(user));
  }

  putMeal(meal: Meal): void {
    this.meals.set(meal.id, copyMeal(meal));
  }

  putRecipe(recipe: Recipe): void {
    this.recipes.set(recipe.id, copyRecipe(recipe));
  }

  putSavedMeal(savedMeal: SavedMeal): void {
    this.savedMeals.set(savedMeal.id, copySavedMeal(savedMeal));
  }
}

export function copyUser(user: User): User {
  return new User({ ...user, goals: { ...user.goals } });
}

export function copyMeal(meal: Meal): Meal {
  return new Meal({
    id: meal.id,
    userId: meal.userId,
    status: meal.status,
    inputType: meal.inputType,
    inputFileKey: meal.inputFileKey,
    inputText: meal.inputText,
    pictureKey: meal.pictureKey,
    name: meal.name,
    items: meal.items.map((item) => ({ ...item })),
    attempts: meal.attempts,
    date: meal.date,
    time: meal.time,
    language: meal.language,
    createdAt: meal.createdAt,
  });
}

export function copyRecipe(recipe: Recipe): Recipe {
  return new Recipe({
    ...recipe,
    ingredients: recipe.ingredients.map((ingredient) => ({ ...ingredient })),
  });
}

export function copySavedMeal(savedMeal: SavedMeal): SavedMeal {
  return new SavedMeal({
    id: savedMeal.id,
    userId: savedMeal.userId,
    name: savedMeal.name,
    items: savedMeal.items.map((item) => ({ ...item })),
    createdAt: savedMeal.createdAt,
  });
}
