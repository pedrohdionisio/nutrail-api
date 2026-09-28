import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { SESv2Client } from '@aws-sdk/client-sesv2';
import { SQSClient } from '@aws-sdk/client-sqs';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import OpenAI from 'openai';
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
import { ChangePasswordUseCase } from '@/application/usecases/account/ChangePasswordUseCase';
import { DeleteAccountUseCase } from '@/application/usecases/account/DeleteAccountUseCase';
import { ConfirmForgotPasswordUseCase } from '@/application/usecases/auth/ConfirmForgotPasswordUseCase';
import { ForgotPasswordUseCase } from '@/application/usecases/auth/ForgotPasswordUseCase';
import { RefreshTokenUseCase } from '@/application/usecases/auth/RefreshTokenUseCase';
import { SignInUseCase } from '@/application/usecases/auth/SignInUseCase';
import { SignUpUseCase } from '@/application/usecases/auth/SignUpUseCase';
import { UpdateGoalsUseCase } from '@/application/usecases/goals/UpdateGoalsUseCase';
import { AnalyzeMealItemsUseCase } from '@/application/usecases/meals/AnalyzeMealItemsUseCase';
import { CreateManualMealUseCase } from '@/application/usecases/meals/CreateManualMealUseCase';
import { CreateMealFromRecipeUseCase } from '@/application/usecases/meals/CreateMealFromRecipeUseCase';
import { CreateMealFromSavedMealUseCase } from '@/application/usecases/meals/CreateMealFromSavedMealUseCase';
import { CreateMealPictureUploadUseCase } from '@/application/usecases/meals/CreateMealPictureUploadUseCase';
import { CreateMealUseCase } from '@/application/usecases/meals/CreateMealUseCase';
import { DeleteMealUseCase } from '@/application/usecases/meals/DeleteMealUseCase';
import { MealUploadedUseCase } from '@/application/usecases/meals/MealUploadedUseCase';
import { ProcessMealUseCase } from '@/application/usecases/meals/ProcessMealUseCase';
import { ReprocessMealUseCase } from '@/application/usecases/meals/ReprocessMealUseCase';
import { UpdateMealUseCase } from '@/application/usecases/meals/UpdateMealUseCase';
import { UpdateProfileUseCase } from '@/application/usecases/profile/UpdateProfileUseCase';
import { DeleteRecipeUseCase } from '@/application/usecases/recipes/DeleteRecipeUseCase';
import { SaveRecipeUseCase } from '@/application/usecases/recipes/SaveRecipeUseCase';
import { SuggestRecipeUseCase } from '@/application/usecases/recipes/SuggestRecipeUseCase';
import { DeleteSavedMealUseCase } from '@/application/usecases/savedMeals/DeleteSavedMealUseCase';
import { SaveMealUseCase } from '@/application/usecases/savedMeals/SaveMealUseCase';
import { GoalCalculator } from '@/domain/services/GoalCalculator';
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
import { Container } from '@/kernel/di/Container';
import { ConfirmForgotPasswordController } from '@/presentation/controllers/auth/ConfirmForgotPasswordController';
import { ForgotPasswordController } from '@/presentation/controllers/auth/ForgotPasswordController';
import { RefreshTokenController } from '@/presentation/controllers/auth/RefreshTokenController';
import { SignInController } from '@/presentation/controllers/auth/SignInController';
import { SignUpController } from '@/presentation/controllers/auth/SignUpController';
import { UpdateGoalsController } from '@/presentation/controllers/goals/UpdateGoalsController';
import { HealthController } from '@/presentation/controllers/HealthController';
import { ChangePasswordController } from '@/presentation/controllers/me/ChangePasswordController';
import { DeleteMeController } from '@/presentation/controllers/me/DeleteMeController';
import { GetMeController } from '@/presentation/controllers/me/GetMeController';
import { AnalyzeMealItemsController } from '@/presentation/controllers/meals/AnalyzeMealItemsController';
import { CreateManualMealController } from '@/presentation/controllers/meals/CreateManualMealController';
import { CreateMealController } from '@/presentation/controllers/meals/CreateMealController';
import { CreateMealPictureUploadController } from '@/presentation/controllers/meals/CreateMealPictureUploadController';
import { DeleteMealController } from '@/presentation/controllers/meals/DeleteMealController';
import { GetMealController } from '@/presentation/controllers/meals/GetMealController';
import { ListMealsByDayController } from '@/presentation/controllers/meals/ListMealsByDayController';
import { ReprocessMealController } from '@/presentation/controllers/meals/ReprocessMealController';
import { UpdateMealController } from '@/presentation/controllers/meals/UpdateMealController';
import { UpdateProfileController } from '@/presentation/controllers/profile/UpdateProfileController';
import { CreateMealFromRecipeController } from '@/presentation/controllers/recipes/CreateMealFromRecipeController';
import { DeleteRecipeController } from '@/presentation/controllers/recipes/DeleteRecipeController';
import { ListRecipesController } from '@/presentation/controllers/recipes/ListRecipesController';
import { SaveRecipeController } from '@/presentation/controllers/recipes/SaveRecipeController';
import { SuggestRecipeController } from '@/presentation/controllers/recipes/SuggestRecipeController';
import { CreateMealFromSavedMealController } from '@/presentation/controllers/savedMeals/CreateMealFromSavedMealController';
import { DeleteSavedMealController } from '@/presentation/controllers/savedMeals/DeleteSavedMealController';
import { ListSavedMealsController } from '@/presentation/controllers/savedMeals/ListSavedMealsController';
import { SaveMealController } from '@/presentation/controllers/savedMeals/SaveMealController';
import { MealFileUploadedHandler } from '@/presentation/file-events/MealFileUploadedHandler';
import { ProcessMealConsumer } from '@/presentation/queue-consumers/ProcessMealConsumer';
import { AppConfig } from '@/shared/config/AppConfig';

export const container = new Container();

container
  .bind(AppConfig, AppConfig, { scope: 'singleton' })
  .bindFactory(
    DynamoDBDocumentClient,
    () =>
      DynamoDBDocumentClient.from(new DynamoDBClient({}), {
        marshallOptions: { removeUndefinedValues: true },
      }),
    { scope: 'singleton' },
  )
  .bindFactory(
    CognitoIdentityProviderClient,
    () => new CognitoIdentityProviderClient({}),
    { scope: 'singleton' },
  )
  .bindFactory(SESv2Client, () => new SESv2Client({}), { scope: 'singleton' })
  .bindFactory(S3Client, () => new S3Client({}), { scope: 'singleton' })
  .bindFactory(SQSClient, () => new SQSClient({}), { scope: 'singleton' })
  .bindFactory(
    OpenAI,
    (c) =>
      new OpenAI({
        apiKey: c.resolve(AppConfig).openai.apiKey,
        timeout: 25_000,
        maxRetries: 1,
      }),
    { scope: 'singleton' },
  );

container
  .bind(IdGenerator, UlidIdGenerator, { scope: 'singleton' })
  .bind(Clock, SystemClock, { scope: 'singleton' })
  .bind(GoalCalculator, GoalCalculator, { scope: 'singleton' })
  .bind(UserRepository, DynamoUserRepository, { scope: 'singleton' })
  .bind(GetProfileQuery, DynamoGetProfileQuery, { scope: 'singleton' })
  .bind(MealRepository, DynamoMealRepository, { scope: 'singleton' })
  .bind(MealAnalyzer, OpenAIMealAnalyzer, { scope: 'singleton' })
  .bind(Transcriber, OpenAITranscriber, { scope: 'singleton' })
  .bind(FileStorage, S3FileStorage, { scope: 'singleton' })
  .bind(MealProcessingQueue, SqsMealProcessingQueue, { scope: 'singleton' })
  .bind(RecipeRepository, DynamoRecipeRepository, { scope: 'singleton' })
  .bind(RecipeGenerator, OpenAIRecipeGenerator, { scope: 'singleton' })
  .bind(ListRecipesQuery, DynamoListRecipesQuery, { scope: 'singleton' })
  .bind(SavedMealRepository, DynamoSavedMealRepository, { scope: 'singleton' })
  .bind(ListSavedMealsQuery, DynamoListSavedMealsQuery, { scope: 'singleton' })
  .bind(ListMealsByDayQuery, DynamoListMealsByDayQuery, { scope: 'singleton' })
  .bind(GetMealQuery, DynamoGetMealQuery, { scope: 'singleton' })
  .bind(UserIdResolver, DynamoUserIdResolver, { scope: 'singleton' })
  .bind(AuthProvider, CognitoAuthProvider, { scope: 'singleton' })
  .bind(EmailSender, SesEmailSender, { scope: 'singleton' })
  .bind(Saga, Saga, { scope: 'transient' });

container
  .bind(SignUpUseCase, SignUpUseCase, { scope: 'transient' })
  .bind(SignInUseCase, SignInUseCase, { scope: 'singleton' })
  .bind(RefreshTokenUseCase, RefreshTokenUseCase, { scope: 'singleton' })
  .bind(ForgotPasswordUseCase, ForgotPasswordUseCase, { scope: 'singleton' })
  .bind(ConfirmForgotPasswordUseCase, ConfirmForgotPasswordUseCase, {
    scope: 'singleton',
  })
  .bind(UpdateProfileUseCase, UpdateProfileUseCase, { scope: 'singleton' })
  .bind(UpdateGoalsUseCase, UpdateGoalsUseCase, { scope: 'singleton' })
  .bind(DeleteAccountUseCase, DeleteAccountUseCase, { scope: 'singleton' })
  .bind(ChangePasswordUseCase, ChangePasswordUseCase, { scope: 'singleton' })
  .bind(CreateManualMealUseCase, CreateManualMealUseCase, {
    scope: 'singleton',
  })
  .bind(CreateMealUseCase, CreateMealUseCase, { scope: 'singleton' })
  .bind(CreateMealPictureUploadUseCase, CreateMealPictureUploadUseCase, {
    scope: 'singleton',
  })
  .bind(MealUploadedUseCase, MealUploadedUseCase, { scope: 'singleton' })
  .bind(ProcessMealUseCase, ProcessMealUseCase, { scope: 'singleton' })
  .bind(UpdateMealUseCase, UpdateMealUseCase, { scope: 'singleton' })
  .bind(DeleteMealUseCase, DeleteMealUseCase, { scope: 'singleton' })
  .bind(ReprocessMealUseCase, ReprocessMealUseCase, { scope: 'singleton' })
  .bind(CreateMealFromRecipeUseCase, CreateMealFromRecipeUseCase, {
    scope: 'singleton',
  })
  .bind(CreateMealFromSavedMealUseCase, CreateMealFromSavedMealUseCase, {
    scope: 'singleton',
  })
  .bind(SaveMealUseCase, SaveMealUseCase, { scope: 'singleton' })
  .bind(DeleteSavedMealUseCase, DeleteSavedMealUseCase, { scope: 'singleton' })
  .bind(AnalyzeMealItemsUseCase, AnalyzeMealItemsUseCase, {
    scope: 'singleton',
  })
  .bind(SuggestRecipeUseCase, SuggestRecipeUseCase, { scope: 'singleton' })
  .bind(SaveRecipeUseCase, SaveRecipeUseCase, { scope: 'singleton' })
  .bind(DeleteRecipeUseCase, DeleteRecipeUseCase, { scope: 'singleton' });

container
  .bind(HealthController, HealthController, { scope: 'transient' })
  .bind(SignUpController, SignUpController, { scope: 'transient' })
  .bind(SignInController, SignInController, { scope: 'transient' })
  .bind(RefreshTokenController, RefreshTokenController, { scope: 'transient' })
  .bind(ForgotPasswordController, ForgotPasswordController, {
    scope: 'transient',
  })
  .bind(ConfirmForgotPasswordController, ConfirmForgotPasswordController, {
    scope: 'transient',
  })
  .bind(GetMeController, GetMeController, { scope: 'transient' })
  .bind(DeleteMeController, DeleteMeController, { scope: 'transient' })
  .bind(ChangePasswordController, ChangePasswordController, {
    scope: 'transient',
  })
  .bind(UpdateProfileController, UpdateProfileController, {
    scope: 'transient',
  })
  .bind(UpdateGoalsController, UpdateGoalsController, { scope: 'transient' })
  .bind(CreateManualMealController, CreateManualMealController, {
    scope: 'transient',
  })
  .bind(ListMealsByDayController, ListMealsByDayController, {
    scope: 'transient',
  })
  .bind(GetMealController, GetMealController, { scope: 'transient' })
  .bind(CreateMealController, CreateMealController, { scope: 'transient' })
  .bind(CreateMealPictureUploadController, CreateMealPictureUploadController, {
    scope: 'transient',
  })
  .bind(UpdateMealController, UpdateMealController, { scope: 'transient' })
  .bind(DeleteMealController, DeleteMealController, { scope: 'transient' })
  .bind(ReprocessMealController, ReprocessMealController, {
    scope: 'transient',
  })
  .bind(AnalyzeMealItemsController, AnalyzeMealItemsController, {
    scope: 'transient',
  })
  .bind(SuggestRecipeController, SuggestRecipeController, {
    scope: 'transient',
  })
  .bind(SaveRecipeController, SaveRecipeController, { scope: 'transient' })
  .bind(ListRecipesController, ListRecipesController, { scope: 'transient' })
  .bind(DeleteRecipeController, DeleteRecipeController, {
    scope: 'transient',
  })
  .bind(CreateMealFromRecipeController, CreateMealFromRecipeController, {
    scope: 'transient',
  })
  .bind(SaveMealController, SaveMealController, { scope: 'transient' })
  .bind(ListSavedMealsController, ListSavedMealsController, {
    scope: 'transient',
  })
  .bind(DeleteSavedMealController, DeleteSavedMealController, {
    scope: 'transient',
  })
  .bind(CreateMealFromSavedMealController, CreateMealFromSavedMealController, {
    scope: 'transient',
  });

container
  .bind(MealFileUploadedHandler, MealFileUploadedHandler, {
    scope: 'transient',
  })
  .bind(ProcessMealConsumer, ProcessMealConsumer, { scope: 'transient' });

container.validate();
