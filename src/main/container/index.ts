import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { SESv2Client } from '@aws-sdk/client-sesv2';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import OpenAI from 'openai';
import { AuthProvider } from '@/application/ports/AuthProvider';
import { Clock } from '@/application/ports/Clock';
import { EmailSender } from '@/application/ports/EmailSender';
import { GetMealQuery } from '@/application/ports/GetMealQuery';
import { GetProfileQuery } from '@/application/ports/GetProfileQuery';
import { IdGenerator } from '@/application/ports/IdGenerator';
import { ListMealsByDayQuery } from '@/application/ports/ListMealsByDayQuery';
import { MealAnalyzer } from '@/application/ports/MealAnalyzer';
import { MealRepository } from '@/application/ports/MealRepository';
import { UserIdResolver } from '@/application/ports/UserIdResolver';
import { UserRepository } from '@/application/ports/UserRepository';
import { Saga } from '@/application/services/Saga';
import { ConfirmForgotPasswordUseCase } from '@/application/usecases/auth/ConfirmForgotPasswordUseCase';
import { ForgotPasswordUseCase } from '@/application/usecases/auth/ForgotPasswordUseCase';
import { RefreshTokenUseCase } from '@/application/usecases/auth/RefreshTokenUseCase';
import { SignInUseCase } from '@/application/usecases/auth/SignInUseCase';
import { SignUpUseCase } from '@/application/usecases/auth/SignUpUseCase';
import { UpdateGoalsUseCase } from '@/application/usecases/goals/UpdateGoalsUseCase';
import { CreateManualMealUseCase } from '@/application/usecases/meals/CreateManualMealUseCase';
import { UpdateProfileUseCase } from '@/application/usecases/profile/UpdateProfileUseCase';
import { GoalCalculator } from '@/domain/services/GoalCalculator';
import { OpenAIMealAnalyzer } from '@/infra/ai/OpenAIMealAnalyzer';
import { CognitoAuthProvider } from '@/infra/auth/CognitoAuthProvider';
import { DynamoUserIdResolver } from '@/infra/auth/DynamoUserIdResolver';
import { DynamoGetMealQuery } from '@/infra/database/dynamo/DynamoGetMealQuery';
import { DynamoGetProfileQuery } from '@/infra/database/dynamo/DynamoGetProfileQuery';
import { DynamoListMealsByDayQuery } from '@/infra/database/dynamo/DynamoListMealsByDayQuery';
import { DynamoMealRepository } from '@/infra/database/dynamo/DynamoMealRepository';
import { DynamoUserRepository } from '@/infra/database/dynamo/DynamoUserRepository';
import { SesEmailSender } from '@/infra/email/SesEmailSender';
import { SystemClock } from '@/infra/shared/SystemClock';
import { UlidIdGenerator } from '@/infra/shared/UlidIdGenerator';
import { Container } from '@/kernel/di/Container';
import { ConfirmForgotPasswordController } from '@/presentation/controllers/auth/ConfirmForgotPasswordController';
import { ForgotPasswordController } from '@/presentation/controllers/auth/ForgotPasswordController';
import { RefreshTokenController } from '@/presentation/controllers/auth/RefreshTokenController';
import { SignInController } from '@/presentation/controllers/auth/SignInController';
import { SignUpController } from '@/presentation/controllers/auth/SignUpController';
import { UpdateGoalsController } from '@/presentation/controllers/goals/UpdateGoalsController';
import { HealthController } from '@/presentation/controllers/HealthController';
import { GetMeController } from '@/presentation/controllers/me/GetMeController';
import { CreateManualMealController } from '@/presentation/controllers/meals/CreateManualMealController';
import { GetMealController } from '@/presentation/controllers/meals/GetMealController';
import { ListMealsByDayController } from '@/presentation/controllers/meals/ListMealsByDayController';
import { UpdateProfileController } from '@/presentation/controllers/profile/UpdateProfileController';
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
  .bind(CreateManualMealUseCase, CreateManualMealUseCase, {
    scope: 'singleton',
  });

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
  .bind(GetMealController, GetMealController, { scope: 'transient' });

container.validate();
