import { describe, expect, it } from 'vitest';
import { handler } from '@/main/functions/getMe';
import { givenSignedInUser, invoke } from '../../support/app';

describe('GET /me', () => {
  it('should return the profile with the email and the goals', async () => {
    const user = givenSignedInUser();

    expect(await invoke(handler, { as: user })).toEqual({
      statusCode: 200,
      body: {
        profile: {
          name: 'Ana Souza',
          email: 'ana@nutrail.test',
          gender: 'FEMALE',
          birthDate: '1995-03-10',
          height: 165,
          weight: 60,
          goal: 'LOSE',
          activityLevel: 'MODERATE',
        },
        goals: { calories: 1800, protein: 120, carbohydrate: 204, fat: 54 },
      },
    });
  });
});
