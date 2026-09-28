import { describe, expect, it } from 'vitest';
import { AuthProvider } from '@/application/ports/AuthProvider';
import { Clock } from '@/application/ports/Clock';
import { EmailSender } from '@/application/ports/EmailSender';
import { FileStorage } from '@/application/ports/FileStorage';
import { GetMealQuery } from '@/application/ports/GetMealQuery';
import { GetProfileQuery } from '@/application/ports/GetProfileQuery';
import { IdGenerator } from '@/application/ports/IdGenerator';
import { ListMealsByDayQuery } from '@/application/ports/ListMealsByDayQuery';
import { ListRecipesQuery } from '@/application/ports/ListRecipesQuery';
import { ListSavedMealsQuery } from '@/application/ports/ListSavedMealsQuery';
import { MealAnalyzer } from '@/application/ports/MealAnalyzer';
import { MealProcessingQueue } from '@/application/ports/MealProcessingQueue';
import { MealRepository } from '@/application/ports/MealRepository';
import { RecipeGenerator } from '@/application/ports/RecipeGenerator';
import { RecipeRepository } from '@/application/ports/RecipeRepository';
import { SavedMealRepository } from '@/application/ports/SavedMealRepository';
import { Transcriber } from '@/application/ports/Transcriber';
import { UserIdResolver } from '@/application/ports/UserIdResolver';
import { UserRepository } from '@/application/ports/UserRepository';
import { Saga } from '@/application/services/Saga';
import { SignUpUseCase } from '@/application/usecases/auth/SignUpUseCase';
import { OpenAIMealAnalyzer } from '@/infra/ai/OpenAIMealAnalyzer';
import { OpenAIRecipeGenerator } from '@/infra/ai/OpenAIRecipeGenerator';
import { OpenAITranscriber } from '@/infra/ai/OpenAITranscriber';
import { CognitoAuthProvider } from '@/infra/auth/CognitoAuthProvider';
import { DynamoUserIdResolver } from '@/infra/auth/DynamoUserIdResolver';
import { DynamoGetMealQuery } from '@/infra/database/dynamo/DynamoGetMealQuery';
import { DynamoGetProfileQuery } from '@/infra/database/dynamo/DynamoGetProfileQuery';
import { DynamoListMealsByDayQuery } from '@/infra/database/dynamo/DynamoListMealsByDayQuery';
import { DynamoListRecipesQuery } from '@/infra/database/dynamo/DynamoListRecipesQuery';
import { DynamoListSavedMealsQuery } from '@/infra/database/dynamo/DynamoListSavedMealsQuery';
import { DynamoMealRepository } from '@/infra/database/dynamo/DynamoMealRepository';
import { DynamoRecipeRepository } from '@/infra/database/dynamo/DynamoRecipeRepository';
import { DynamoSavedMealRepository } from '@/infra/database/dynamo/DynamoSavedMealRepository';
import { DynamoUserRepository } from '@/infra/database/dynamo/DynamoUserRepository';
import { SesEmailSender } from '@/infra/email/SesEmailSender';
import { SqsMealProcessingQueue } from '@/infra/queue/SqsMealProcessingQueue';
import { SystemClock } from '@/infra/shared/SystemClock';
import { UlidIdGenerator } from '@/infra/shared/UlidIdGenerator';
import { S3FileStorage } from '@/infra/storage/S3FileStorage';
import type { Token } from '@/kernel/di/Container';
import { container } from '@/main/container';

const PRODUCTION_BINDINGS: [Token, Token][] = [
  [Clock, SystemClock],
  [IdGenerator, UlidIdGenerator],
  [UserRepository, DynamoUserRepository],
  [MealRepository, DynamoMealRepository],
  [RecipeRepository, DynamoRecipeRepository],
  [SavedMealRepository, DynamoSavedMealRepository],
  [GetProfileQuery, DynamoGetProfileQuery],
  [GetMealQuery, DynamoGetMealQuery],
  [ListMealsByDayQuery, DynamoListMealsByDayQuery],
  [ListRecipesQuery, DynamoListRecipesQuery],
  [ListSavedMealsQuery, DynamoListSavedMealsQuery],
  [UserIdResolver, DynamoUserIdResolver],
  [AuthProvider, CognitoAuthProvider],
  [FileStorage, S3FileStorage],
  [MealAnalyzer, OpenAIMealAnalyzer],
  [Transcriber, OpenAITranscriber],
  [RecipeGenerator, OpenAIRecipeGenerator],
  [MealProcessingQueue, SqsMealProcessingQueue],
  [EmailSender, SesEmailSender],
];

describe('container', () => {
  it.each(PRODUCTION_BINDINGS)(
    'should bind %o to its production implementation',
    (port, impl) => {
      expect(container.resolve(port)).toBeInstanceOf(impl);
    },
  );

  it('should give each sign-up its own saga', () => {
    expect(container.resolve(Saga)).not.toBe(container.resolve(Saga));
    expect(container.resolve(SignUpUseCase)).not.toBe(
      container.resolve(SignUpUseCase),
    );
  });
});
