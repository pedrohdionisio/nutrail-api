import { InvalidMealTransitionError } from '../errors/InvalidMealTransitionError';
import { MealNotEditableError } from '../errors/MealNotEditableError';
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
  time: string;
  createdAt: string;
};

export class Meal {
  readonly id: string;
  readonly userId: string;
  readonly inputType: MealInputType;
  readonly inputFileKey: string | null;
  readonly date: string;
  readonly time: string;
  readonly createdAt: string;
  private _status: MealStatus;
  private _inputText: string | null;
  private _pictureKey: string | null;
  private _name: string | null;
  private _items: MealItem[];
  private _attempts: number;

  constructor(props: MealProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.inputType = props.inputType;
    this.inputFileKey = props.inputFileKey;
    this.date = props.date;
    this.time = props.time;
    this.createdAt = props.createdAt;
    this._status = props.status;
    this._inputText = props.inputText;
    this._pictureKey = props.pictureKey;
    this._name = props.name;
    this._items = props.items;
    this._attempts = props.attempts;
  }

  get status(): MealStatus {
    return this._status;
  }

  get inputText(): string | null {
    return this._inputText;
  }

  get pictureKey(): string | null {
    return this._pictureKey;
  }

  get isFinished(): boolean {
    return this._status === 'SUCCESS' || this._status === 'FAILED';
  }

  get attempts(): number {
    return this._attempts;
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

  markAsQueued(): void {
    this.transition(['UPLOADING'], 'QUEUED');
  }

  markAsProcessing(): void {
    this.transition(['QUEUED'], 'PROCESSING');
    this._attempts += 1;
  }

  recordTranscription(text: string): void {
    if (this._status !== 'PROCESSING') {
      throw new InvalidMealTransitionError(this._status, 'PROCESSING');
    }

    this._inputText = text;
  }

  attachPicture(key: string): void {
    if (!this.isFinished) {
      throw new InvalidMealTransitionError(this._status, 'picture attached');
    }

    this._pictureKey = key;
  }

  requeue(): void {
    this.transition(['PROCESSING'], 'QUEUED');
  }

  retry(): void {
    if (this.inputType === 'MANUAL') {
      throw new InvalidMealTransitionError(this._status, 'QUEUED');
    }

    this.transition(['FAILED'], 'QUEUED');
    this._attempts = 0;
  }

  fail(): void {
    this.transition(['QUEUED', 'PROCESSING'], 'FAILED');
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

  edit({ name, items }: MealAnalysis): void {
    if (this._status !== 'SUCCESS') {
      throw new MealNotEditableError();
    }

    if (items.length === 0) {
      throw new MealWithoutItemsError();
    }

    this._name = name;
    this._items = items;
  }

  private transition(from: MealStatus[], to: MealStatus): void {
    if (!from.includes(this._status)) {
      throw new InvalidMealTransitionError(this._status, to);
    }

    this._status = to;
  }
}
