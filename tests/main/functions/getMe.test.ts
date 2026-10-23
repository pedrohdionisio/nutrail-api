import { describe, expect, it } from 'vitest';
import { handler } from '@/main/functions/getMe';
import { fakes, givenSignedInUser, invoke } from '../../support/app';
import { buildSubscription } from '../../support/fixtures/subscription';

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
        subscription: { plan: 'FREE', cancelAt: null },
        dailyLimits: { mealAnalyses: 20, recipes: 5 },
      },
    });
  });

  it('should return the premium plan and its limits while the subscription is active', async () => {
    const user = givenSignedInUser();
    fakes().db.putSubscription(
      buildSubscription({
        userId: user.id,
        cancelAt: '2026-10-26T15:00:00.000Z',
      }),
    );

    const response = await invoke(handler, { as: user });

    expect(response.body).toMatchObject({
      subscription: { plan: 'PREMIUM', cancelAt: '2026-10-26T15:00:00.000Z' },
      dailyLimits: { mealAnalyses: 100, recipes: 30 },
    });
  });

  it('should return the free plan after the subscription ends', async () => {
    const user = givenSignedInUser();
    fakes().db.putSubscription(
      buildSubscription({ userId: user.id, status: 'CANCELED' }),
    );

    const response = await invoke(handler, { as: user });

    expect(response.body).toMatchObject({
      subscription: { plan: 'FREE' },
      dailyLimits: { mealAnalyses: 20, recipes: 5 },
    });
  });
});
