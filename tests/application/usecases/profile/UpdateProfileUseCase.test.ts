import { beforeEach, describe, expect, it } from 'vitest';
import { UserNotFoundError } from '@/application/errors/UserNotFoundError';
import { UpdateProfileUseCase } from '@/application/usecases/profile/UpdateProfileUseCase';
import { GoalCalculator } from '@/domain/services/GoalCalculator';
import { createFakes, type Fakes } from '../../../support/fakes/createFakes';
import { buildProfile, buildUser } from '../../../support/fixtures/user';

describe('UpdateProfileUseCase', () => {
  let f: Fakes;
  let updateProfile: UpdateProfileUseCase;

  beforeEach(() => {
    f = createFakes();
    updateProfile = new UpdateProfileUseCase(
      f.users,
      new GoalCalculator(),
      f.clock,
    );
  });

  it('should save the profile and replace the goals with recalculated ones', async () => {
    f.db.putUser(
      buildUser({
        goals: { calories: 3000, protein: 1, carbohydrate: 1, fat: 1 },
      }),
    );
    const profile = buildProfile({ weight: 58, goal: 'MAINTAIN' });

    const result = await updateProfile.execute({ userId: 'user-1', profile });

    const expectedGoals = new GoalCalculator().calculate(
      profile,
      f.clock.now(),
    );
    expect(result).toEqual({ goals: expectedGoals });
    expect(f.db.users.get('user-1')).toMatchObject({
      weight: 58,
      goal: 'MAINTAIN',
      email: 'ana@nutrail.test',
      goals: expectedGoals,
    });
  });

  it('should fail for an unknown user', async () => {
    await expect(
      updateProfile.execute({ userId: 'nobody', profile: buildProfile() }),
    ).rejects.toThrow(UserNotFoundError);
  });
});
