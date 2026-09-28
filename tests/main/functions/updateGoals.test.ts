import { describe, expect, it } from 'vitest';
import { handler } from '@/main/functions/updateGoals';
import {
  errorBody,
  givenSignedInUser,
  invoke,
  validationErrorBody,
} from '../../support/app';

describe('PUT /goals', () => {
  it('should update the calories keeping protein and fat', async () => {
    const user = givenSignedInUser();

    expect(
      await invoke(handler, { as: user, body: { calories: 2000 } }),
    ).toEqual({
      statusCode: 200,
      body: {
        goals: { calories: 2000, protein: 120, carbohydrate: 259, fat: 54 },
      },
    });
  });

  it('should update the macros deriving the calories', async () => {
    const user = givenSignedInUser();

    expect(
      await invoke(handler, {
        as: user,
        body: { protein: 100, carbohydrate: 200, fat: 50 },
      }),
    ).toEqual({
      statusCode: 200,
      body: {
        goals: { calories: 1650, protein: 100, carbohydrate: 200, fat: 50 },
      },
    });
  });

  it('should answer 422 when the calories do not cover protein and fat', async () => {
    const user = givenSignedInUser();

    expect(
      await invoke(handler, { as: user, body: { calories: 900 } }),
    ).toEqual({
      statusCode: 422,
      body: errorBody('GOALS_BELOW_MACROS'),
    });
  });

  it('should refuse mixing calories and macros', async () => {
    const user = givenSignedInUser();

    const response = await invoke(handler, {
      as: user,
      body: { calories: 2000, protein: 100 },
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchObject({ error: { code: 'VALIDATION' } });
  });

  it('should refuse non-integer values', async () => {
    const user = givenSignedInUser();

    expect(
      await invoke(handler, { as: user, body: { calories: 1999.5 } }),
    ).toMatchObject({
      statusCode: 400,
      body: validationErrorBody(),
    });
  });
});
