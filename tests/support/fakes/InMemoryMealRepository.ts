import type { MealRepository } from '@/application/ports/MealRepository';
import type { Meal } from '@/domain/entities/Meal';
import { copyMeal, type InMemoryDatabase } from './InMemoryDatabase';

export class InMemoryMealRepository implements MealRepository {
  constructor(private readonly db: InMemoryDatabase) {}

  async findById(userId: string, mealId: string): Promise<Meal | null> {
    const meal = this.db.meals.get(mealId);

    return meal?.userId === userId ? copyMeal(meal) : null;
  }

  async create(meal: Meal): Promise<void> {
    if (this.db.meals.has(meal.id)) {
      throw new Error(`Meal ${meal.id} already exists.`);
    }

    this.db.putMeal(meal);
  }

  async update(meal: Meal): Promise<void> {
    if (!this.db.meals.has(meal.id)) {
      throw new Error(`Meal ${meal.id} does not exist.`);
    }

    this.db.putMeal(meal);
  }

  async delete(userId: string, mealId: string): Promise<void> {
    if (this.db.meals.get(mealId)?.userId === userId) {
      this.db.meals.delete(mealId);
    }
  }
}
