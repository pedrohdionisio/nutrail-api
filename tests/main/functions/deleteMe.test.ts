import { describe, expect, it } from 'vitest';
import { handler } from '@/main/functions/deleteMe';
import { fakes, givenSignedInUser, invoke } from '../../support/app';
import { buildMeal } from '../../support/fixtures/meal';
import { buildRecipe } from '../../support/fixtures/recipe';

describe('DELETE /me', () => {
  it('should delete the account with its files and data', async () => {
    const user = givenSignedInUser();
    fakes().db.putMeal(buildMeal());
    fakes().db.putRecipe(buildRecipe());
    fakes().storage.putFile('pictures/user-1/meal-1.jpg');

    expect(await invoke(handler, { as: user })).toEqual({
      statusCode: 204,
      body: undefined,
    });
    expect(fakes().db.users.size).toBe(0);
    expect(fakes().db.meals.size).toBe(0);
    expect(fakes().db.recipes.size).toBe(0);
    expect(fakes().storage.files.size).toBe(0);
    expect(fakes().auth.deletedExternalIds).toEqual(['sub-1']);
  });
});
