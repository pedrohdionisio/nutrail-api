import { beforeEach, describe, expect, it } from 'vitest';
import { UserNotFoundError } from '@/application/errors/UserNotFoundError';
import { UpdateGoalsUseCase } from '@/application/usecases/goals/UpdateGoalsUseCase';
import { GoalsBelowMacrosError } from '@/domain/errors/GoalsBelowMacrosError';
import { GoalCalculator } from '@/domain/services/GoalCalculator';
import { createFakes, type Fakes } from '../../../support/fakes/createFakes';
import { buildUser } from '../../../support/fixtures/user';

describe('UpdateGoalsUseCase', () => {
  let f: Fakes;
  let updateGoals: UpdateGoalsUseCase;

  beforeEach(() => {
    f = createFakes();
    updateGoals = new UpdateGoalsUseCase(f.users, new GoalCalculator());
    f.db.putUser(
      buildUser({
        goals: { calories: 1800, protein: 120, carbohydrate: 204, fat: 54 },
      }),
    );
  });

  it('should keep protein and fat when only the calories change', async () => {
    const result = await updateGoals.execute({
      userId: 'user-1',
      goals: { calories: 2000 },
    });

    expect(result.goals).toEqual({
      calories: 2000,
      protein: 120,
      carbohydrate: 259,
      fat: 54,
    });
    expect(f.db.users.get('user-1')?.goals).toEqual(result.goals);
  });

  it('should derive the calories when the macros change', async () => {
    const result = await updateGoals.execute({
      userId: 'user-1',
      goals: { protein: 100, carbohydrate: 200, fat: 50 },
    });

    expect(result.goals).toEqual({
      calories: 1650,
      protein: 100,
      carbohydrate: 200,
      fat: 50,
    });
  });

  it('should refuse calories that do not cover protein and fat', async () => {
    await expect(
      updateGoals.execute({ userId: 'user-1', goals: { calories: 900 } }),
    ).rejects.toThrow(GoalsBelowMacrosError);
    expect(f.db.users.get('user-1')?.goals.calories).toBe(1800);
  });

  it('should fail for an unknown user', async () => {
    await expect(
      updateGoals.execute({ userId: 'nobody', goals: { calories: 2000 } }),
    ).rejects.toThrow(UserNotFoundError);
  });
});
