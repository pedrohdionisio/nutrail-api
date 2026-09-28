import { describe, expect, it } from 'vitest';
import { mealFileKey } from '@/application/services/mealFiles';

describe('mealFileKey', () => {
  it('should put pictures and audio inputs in their own folders per user', () => {
    expect(mealFileKey('PICTURE', 'user-1', 'meal-1')).toBe(
      'pictures/user-1/meal-1.jpg',
    );
    expect(mealFileKey('AUDIO', 'user-1', 'meal-1')).toBe(
      'inputs/user-1/meal-1.m4a',
    );
  });
});
