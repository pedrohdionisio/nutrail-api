import { describe, expect, it } from 'vitest';
import { GoalsBelowMacrosError } from '@/domain/errors/GoalsBelowMacrosError';
import { GoalCalculator } from '@/domain/services/GoalCalculator';
import { buildProfile } from '../../support/fixtures/user';

const calculator = new GoalCalculator();

const NOW = new Date('2026-09-26T12:00:00.000Z');

describe('GoalCalculator', () => {
  describe('calculate', () => {
    it('should use Mifflin-St Jeor, the activity factor and the goal adjustment', () => {
      const goals = calculator.calculate(
        buildProfile({
          gender: 'FEMALE',
          birthDate: '1995-03-10',
          height: 165,
          weight: 60,
          activityLevel: 'MODERATE',
          goal: 'LOSE',
        }),
        NOW,
      );

      expect(goals).toEqual({
        calories: 1539,
        protein: 120,
        carbohydrate: 143,
        fat: 54,
      });
    });

    it('should add 5 kcal to the base rate for men and 500 kcal to gain weight', () => {
      const goals = calculator.calculate(
        buildProfile({
          gender: 'MALE',
          birthDate: '1990-01-01',
          height: 180,
          weight: 80,
          activityLevel: 'SEDENTARY',
          goal: 'GAIN',
        }),
        NOW,
      );

      expect(goals).toEqual({
        calories: 2600,
        protein: 160,
        carbohydrate: 328,
        fat: 72,
      });
    });

    it('should count the age from the exact birthday', () => {
      const profile = buildProfile({
        birthDate: '1996-09-27',
        goal: 'MAINTAIN',
      });

      const dayBefore = calculator.calculate(
        profile,
        new Date('2026-09-26T12:00:00.000Z'),
      );
      const birthday = calculator.calculate(
        profile,
        new Date('2026-09-27T12:00:00.000Z'),
      );

      expect(dayBefore.calories - birthday.calories).toBe(8);
    });

    it('should never return negative carbohydrates', () => {
      const goals = calculator.calculate(
        buildProfile({
          weight: 150,
          height: 150,
          activityLevel: 'SEDENTARY',
          goal: 'LOSE',
        }),
        NOW,
      );

      expect(goals.carbohydrate).toBe(0);
    });
  });

  describe('fromCalories', () => {
    it('should keep protein and fat and complete with carbohydrates', () => {
      expect(calculator.fromCalories(2000, { protein: 120, fat: 54 })).toEqual({
        calories: 2000,
        protein: 120,
        carbohydrate: 259,
        fat: 54,
      });
    });

    it('should refuse calories below what protein and fat require', () => {
      expect(() =>
        calculator.fromCalories(900, { protein: 120, fat: 54 }),
      ).toThrow(GoalsBelowMacrosError);
    });
  });

  describe('fromMacros', () => {
    it('should sum 4 kcal per gram of protein and carbohydrate and 9 per gram of fat', () => {
      expect(
        calculator.fromMacros({ protein: 100, carbohydrate: 200, fat: 50 }),
      ).toEqual({
        calories: 1650,
        protein: 100,
        carbohydrate: 200,
        fat: 50,
      });
    });
  });
});
