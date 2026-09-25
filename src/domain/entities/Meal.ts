import { InvalidMealTransitionError } from '../errors/InvalidMealTransitionError';
import { MealWithoutItemsError } from '../errors/MealWithoutItemsError';
import type { Macros } from '../value-objects/Macros';

export const MEAL_STATUSES = [
  'UPLOADING',
  'QUEUED',
  'PROCESSING',
  'SUCCESS',
  'FAILED',
] as const;
export type MealStatus = (typeof MEAL_STATUSES)[number];

export const MEAL_INPUT_TYPES = ['PICTURE', 'AUDIO', 'MANUAL'] as const;
export type MealInputType = (typeof MEAL_INPUT_TYPES)[number];

export type MealItem = Macros & {
  name: string;
  quantity: number;
  unit: string;
};

export type MealAnalysis = {
  name: string;
  items: MealItem[];
};

type MealProps = {
  id: string;
  userId: string;
  status: MealStatus;
  inputType: MealInputType;
  inputFileKey: string | null;
  inputText: string | null;
  pictureKey: string | null;
  name: string | null;
  items: MealItem[];
  attempts: number;
  date: string;
  createdAt: string;
};

export class Meal {
  readonly id: string;
  readonly userId: string;
  readonly inputType: MealInputType;
  readonly inputFileKey: string | null;
  readonly inputText: string | null;
  readonly pictureKey: string | null;
  readonly attempts: number;
  readonly date: string;
  readonly createdAt: string;
  private _status: MealStatus;
  private _name: string | null;
  private _items: MealItem[];

  constructor(props: MealProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.inputType = props.inputType;
    this.inputFileKey = props.inputFileKey;
    this.inputText = props.inputText;
    this.pictureKey = props.pictureKey;
    this.attempts = props.attempts;
    this.date = props.date;
    this.createdAt = props.createdAt;
    this._status = props.status;
    this._name = props.name;
    this._items = props.items;
  }

  get status(): MealStatus {
    return this._status;
  }

  get name(): string | null {
    return this._name;
  }

  get items(): readonly MealItem[] {
    return this._items;
  }

  get totals(): Macros {
    const sum = (key: keyof Macros) =>
      Math.round(
        this._items.reduce((total, item) => total + item[key], 0) * 10,
      ) / 10;

    return {
      calories: Math.round(sum('calories')),
      protein: sum('protein'),
      carbohydrate: sum('carbohydrate'),
      fat: sum('fat'),
    };
  }

  complete({ name, items }: MealAnalysis): void {
    if (this._status !== 'PROCESSING') {
      throw new InvalidMealTransitionError(this._status, 'SUCCESS');
    }

    if (items.length === 0) {
      throw new MealWithoutItemsError();
    }

    this._status = 'SUCCESS';
    this._name = name;
    this._items = items;
  }
}
