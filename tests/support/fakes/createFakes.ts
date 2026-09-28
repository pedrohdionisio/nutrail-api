import { FakeAuthProvider } from './FakeAuthProvider';
import { FakeEmailSender } from './FakeEmailSender';
import { FakeFileStorage } from './FakeFileStorage';
import { FakeMealAnalyzer } from './FakeMealAnalyzer';
import { FakeMealProcessingQueue } from './FakeMealProcessingQueue';
import { FakeRecipeGenerator } from './FakeRecipeGenerator';
import { FakeTranscriber } from './FakeTranscriber';
import { FixedClock } from './FixedClock';
import { InMemoryDatabase } from './InMemoryDatabase';
import { InMemoryMealRepository } from './InMemoryMealRepository';
import {
  InMemoryGetMealQuery,
  InMemoryGetProfileQuery,
  InMemoryListMealsByDayQuery,
  InMemoryListRecipesQuery,
  InMemoryListSavedMealsQuery,
  InMemoryUserIdResolver,
} from './InMemoryQueries';
import { InMemoryRecipeRepository } from './InMemoryRecipeRepository';
import { InMemorySavedMealRepository } from './InMemorySavedMealRepository';
import { InMemoryUserRepository } from './InMemoryUserRepository';
import { SequentialIdGenerator } from './SequentialIdGenerator';

export function createFakes() {
  const db = new InMemoryDatabase();

  return {
    db,
    clock: new FixedClock(),
    ids: new SequentialIdGenerator(),
    users: new InMemoryUserRepository(db),
    meals: new InMemoryMealRepository(db),
    recipes: new InMemoryRecipeRepository(db),
    savedMeals: new InMemorySavedMealRepository(db),
    getProfile: new InMemoryGetProfileQuery(db),
    getMeal: new InMemoryGetMealQuery(db),
    listMealsByDay: new InMemoryListMealsByDayQuery(db),
    listRecipes: new InMemoryListRecipesQuery(db),
    listSavedMeals: new InMemoryListSavedMealsQuery(db),
    userIdResolver: new InMemoryUserIdResolver(db),
    auth: new FakeAuthProvider(),
    storage: new FakeFileStorage(),
    analyzer: new FakeMealAnalyzer(),
    transcriber: new FakeTranscriber(),
    recipeGenerator: new FakeRecipeGenerator(),
    queue: new FakeMealProcessingQueue(),
    emails: new FakeEmailSender(),
  };
}

export type Fakes = ReturnType<typeof createFakes>;
