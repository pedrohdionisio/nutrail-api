import { describe, expect, it } from 'vitest';
import { handler } from '@/main/functions/updateProfile';
import {
  fakes,
  givenSignedInUser,
  invoke,
  validationErrorBody,
} from '../../support/app';
import { buildProfile } from '../../support/fixtures/user';

describe('PUT /profile', () => {
  it('should save the profile and return the recalculated goals', async () => {
    const user = givenSignedInUser();

    const response = await invoke(handler, {
      as: user,
      body: buildProfile({
        weight: 58,
        goal: 'MAINTAIN',
        activityLevel: 'LIGHT',
      }),
    });

    expect(response).toEqual({
      statusCode: 200,
      body: {
        goals: { calories: 1781, protein: 116, carbohydrate: 212, fat: 52 },
      },
    });
    expect(fakes().db.users.get('user-1')).toMatchObject({
      weight: 58,
      goal: 'MAINTAIN',
    });
  });

  it('should validate the profile', async () => {
    const user = givenSignedInUser();

    expect(
      await invoke(handler, {
        as: user,
        body: { ...buildProfile(), name: '  ', gender: 'OTHER', weight: -1 },
      }),
    ).toEqual({
      statusCode: 400,
      body: validationErrorBody('name', 'gender', 'weight'),
    });
  });
});
