import type { ActivityLevel, Goal, UserProfile } from '../entities/User';
import { GoalsBelowMacrosError } from '../errors/GoalsBelowMacrosError';
import type { Macros } from '../value-objects/Macros';

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  HEAVY: 1.725,
  ATHLETE: 1.9,
};

const GOAL_ADJUSTMENTS: Record<Goal, number> = {
  LOSE: -500,
  MAINTAIN: 0,
  GAIN: 500,
};

const PROTEIN_PER_KG = 2;
const FAT_PER_KG = 0.9;

const KCAL_PER_GRAM = { protein: 4, carbohydrate: 4, fat: 9 };

type FixedMacros = Pick<Macros, 'protein' | 'fat'>;

export class GoalCalculator {
  calculate(profile: UserProfile, now: Date): Macros {
    const age = ageAt(profile.birthDate, now);

    const bmr =
      10 * profile.weight +
      6.25 * profile.height -
      5 * age +
      (profile.gender === 'MALE' ? 5 : -161);

    const calories = Math.round(
      bmr * ACTIVITY_FACTORS[profile.activityLevel] +
        GOAL_ADJUSTMENTS[profile.goal],
    );

    const protein = Math.round(profile.weight * PROTEIN_PER_KG);
    const fat = Math.round(profile.weight * FAT_PER_KG);

    const carbohydrate = Math.max(
      0,
      carbohydrateFor(calories, { protein, fat }),
    );

    return { calories, protein, carbohydrate, fat };
  }

  fromCalories(calories: number, { protein, fat }: FixedMacros): Macros {
    const carbohydrate = carbohydrateFor(calories, { protein, fat });

    if (carbohydrate < 0) {
      throw new GoalsBelowMacrosError();
    }

    return { calories, protein, carbohydrate, fat };
  }

  fromMacros({ protein, carbohydrate, fat }: Omit<Macros, 'calories'>): Macros {
    const calories =
      protein * KCAL_PER_GRAM.protein +
      carbohydrate * KCAL_PER_GRAM.carbohydrate +
      fat * KCAL_PER_GRAM.fat;

    return { calories, protein, carbohydrate, fat };
  }
}

function carbohydrateFor(calories: number, { protein, fat }: FixedMacros) {
  return Math.round(
    (calories - protein * KCAL_PER_GRAM.protein - fat * KCAL_PER_GRAM.fat) /
      KCAL_PER_GRAM.carbohydrate,
  );
}

function ageAt(birthDate: string, now: Date): number {
  const [year, month, day] = birthDate.split('-').map(Number) as [
    number,
    number,
    number,
  ];

  const age = now.getUTCFullYear() - year;

  const hadBirthday =
    now.getUTCMonth() + 1 > month ||
    (now.getUTCMonth() + 1 === month && now.getUTCDate() >= day);

  return hadBirthday ? age : age - 1;
}
