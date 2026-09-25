import type { Macros } from '../value-objects/Macros';

export type Ingredient = {
  name: string;
  quantity: number;
  unit: string;
};

export type RecipeContent = Macros & {
  name: string;
  ingredients: Ingredient[];
  instructions: string;
};

type RecipeProps = RecipeContent & {
  id: string;
  userId: string;
  createdAt: string;
};

export class Recipe {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly ingredients: Ingredient[];
  readonly instructions: string;
  readonly calories: number;
  readonly protein: number;
  readonly carbohydrate: number;
  readonly fat: number;
  readonly createdAt: string;

  constructor(props: RecipeProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.name = props.name;
    this.ingredients = props.ingredients;
    this.instructions = props.instructions;
    this.calories = props.calories;
    this.protein = props.protein;
    this.carbohydrate = props.carbohydrate;
    this.fat = props.fat;
    this.createdAt = props.createdAt;
  }
}
