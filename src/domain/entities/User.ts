import type { Macros } from '../value-objects/Macros';

export const GENDERS = ['MALE', 'FEMALE'] as const;
export type Gender = (typeof GENDERS)[number];

export const GOALS = ['LOSE', 'MAINTAIN', 'GAIN'] as const;
export type Goal = (typeof GOALS)[number];

export const ACTIVITY_LEVELS = [
  'SEDENTARY',
  'LIGHT',
  'MODERATE',
  'HEAVY',
  'ATHLETE',
] as const;
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];

export type UserProfile = {
  name: string;
  gender: Gender;
  birthDate: string;
  height: number;
  weight: number;
  goal: Goal;
  activityLevel: ActivityLevel;
};

type UserProps = UserProfile & {
  id: string;
  externalId: string;
  email: string;
  goals: Macros;
  createdAt: string;
};

export class User {
  readonly id: string;
  readonly externalId: string;
  readonly email: string;
  readonly name: string;
  readonly gender: Gender;
  readonly birthDate: string;
  readonly height: number;
  readonly weight: number;
  readonly goal: Goal;
  readonly activityLevel: ActivityLevel;
  readonly goals: Macros;
  readonly createdAt: string;

  constructor(props: UserProps) {
    this.id = props.id;
    this.externalId = props.externalId;
    this.email = props.email;
    this.name = props.name;
    this.gender = props.gender;
    this.birthDate = props.birthDate;
    this.height = props.height;
    this.weight = props.weight;
    this.goal = props.goal;
    this.activityLevel = props.activityLevel;
    this.goals = props.goals;
    this.createdAt = props.createdAt;
  }
}
