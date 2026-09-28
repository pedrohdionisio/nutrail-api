import { beforeEach, describe, expect, it } from 'vitest';
import { UserNotFoundError } from '@/application/errors/UserNotFoundError';
import { DeleteAccountUseCase } from '@/application/usecases/account/DeleteAccountUseCase';
import { createFakes, type Fakes } from '../../../support/fakes/createFakes';
import { buildMeal } from '../../../support/fixtures/meal';
import { buildRecipe } from '../../../support/fixtures/recipe';
import { buildSavedMeal } from '../../../support/fixtures/savedMeal';
import { buildUser } from '../../../support/fixtures/user';

describe('DeleteAccountUseCase', () => {
  let f: Fakes;
  let deleteAccount: DeleteAccountUseCase;

  beforeEach(() => {
    f = createFakes();
    deleteAccount = new DeleteAccountUseCase(f.users, f.auth, f.storage);
  });

  it('should delete the files, the auth account and every item of the user', async () => {
    f.db.putUser(buildUser());
    f.db.putUser(
      buildUser({
        id: 'user-2',
        externalId: 'sub-2',
        email: 'bia@nutrail.test',
      }),
    );
    f.db.putMeal(buildMeal());
    f.db.putMeal(buildMeal({ id: 'meal-2', userId: 'user-2' }));
    f.db.putRecipe(buildRecipe());
    f.db.putSavedMeal(buildSavedMeal());
    f.auth.addAccount({
      externalId: 'sub-1',
      email: 'ana@nutrail.test',
      password: 'senha',
    });
    f.storage.putFile('pictures/user-1/meal-1.jpg');
    f.storage.putFile('inputs/user-1/meal-3.m4a');
    f.storage.putFile('pictures/user-2/meal-2.jpg');

    await deleteAccount.execute('user-1');

    expect([...f.storage.files.keys()]).toEqual(['pictures/user-2/meal-2.jpg']);
    expect(f.auth.deletedExternalIds).toEqual(['sub-1']);
    expect([...f.db.users.keys()]).toEqual(['user-2']);
    expect([...f.db.meals.keys()]).toEqual(['meal-2']);
    expect(f.db.recipes.size).toBe(0);
    expect(f.db.savedMeals.size).toBe(0);
  });

  it('should fail for an unknown user without deleting anything', async () => {
    f.storage.putFile('pictures/nobody/meal-1.jpg');

    await expect(deleteAccount.execute('nobody')).rejects.toThrow(
      UserNotFoundError,
    );
    expect(f.storage.files.size).toBe(1);
    expect(f.auth.deletedExternalIds).toEqual([]);
  });
});
