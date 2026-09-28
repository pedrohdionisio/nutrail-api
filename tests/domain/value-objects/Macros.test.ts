import { describe, expect, it } from 'vitest';
import { sumMacros } from '@/domain/value-objects/Macros';

describe('sumMacros', () => {
  it('should sum each macro, rounding calories to integers and grams to one decimal', () => {
    expect(
      sumMacros([
        { calories: 156.4, protein: 3.14, carbohydrate: 34.06, fat: 0.33 },
        { calories: 247.3, protein: 46.52, carbohydrate: 0, fat: 5.41 },
      ]),
    ).toEqual({ calories: 404, protein: 49.7, carbohydrate: 34.1, fat: 5.7 });
  });

  it('should avoid floating point noise in the sum', () => {
    expect(
      sumMacros([
        { calories: 1, protein: 0.1, carbohydrate: 0.1, fat: 0.1 },
        { calories: 1, protein: 0.2, carbohydrate: 0.2, fat: 0.2 },
      ]),
    ).toEqual({ calories: 2, protein: 0.3, carbohydrate: 0.3, fat: 0.3 });
  });

  it('should return zero for no items', () => {
    expect(sumMacros([])).toEqual({
      calories: 0,
      protein: 0,
      carbohydrate: 0,
      fat: 0,
    });
  });
});
