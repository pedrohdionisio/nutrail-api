import { type Macros, sumMacros } from '../value-objects/Macros';
import { Meal, type MealItem } from './Meal';

type SavedMealProps = {
  id: string;
  userId: string;
  name: string;
  items: MealItem[];
  createdAt: string;
};

export type SavedMealLog = {
  id: string;
  date: string;
  time: string;
  createdAt: string;
};

export class SavedMeal {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly items: readonly MealItem[];
  readonly createdAt: string;

  constructor(props: SavedMealProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.name = props.name;
    this.items = props.items;
    this.createdAt = props.createdAt;
  }

  get totals(): Macros {
    return sumMacros(this.items);
  }

  toMeal({ id, date, time, createdAt }: SavedMealLog): Meal {
    return new Meal({
      id,
      userId: this.userId,
      status: 'SUCCESS',
      inputType: 'MANUAL',
      inputFileKey: null,
      inputText: null,
      pictureKey: null,
      name: this.name,
      items: this.items.map((item) => ({ ...item })),
      attempts: 0,
      date,
      time,
      createdAt,
    });
  }
}
