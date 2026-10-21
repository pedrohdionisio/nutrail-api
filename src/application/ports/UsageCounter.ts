export const USAGE_KINDS = ['MEAL_ANALYSIS', 'RECIPE'] as const;

export type UsageKind = (typeof USAGE_KINDS)[number];

export type UsageIncrement = {
  userId: string;
  kind: UsageKind;
  day: string;
  limit: number;
};

export abstract class UsageCounter {
  abstract increment(input: UsageIncrement): Promise<boolean>;
}
