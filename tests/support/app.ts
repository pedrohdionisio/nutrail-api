import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  S3ObjectCreatedNotificationEvent,
  SQSBatchResponse,
  SQSEvent,
} from 'aws-lambda';
import { beforeEach, expect } from 'vitest';
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
import type { User } from '@/domain/entities/User';
import type { Token } from '@/kernel/di/Container';
import { container } from '@/main/container';
import { createFakes, type Fakes } from './fakes/createFakes';
import { buildUser } from './fixtures/user';

let current: Fakes = createFakes();

export function fakes(): Fakes {
  return current;
}

function bindToCurrent<T extends object>(
  token: Token<T>,
  pick: (fakes: Fakes) => T,
): void {
  const delegate = new Proxy(
    {},
    {
      get: (_, property) => {
        const target = pick(current);
        const value = Reflect.get(target, property, target);

        return typeof value === 'function' ? value.bind(target) : value;
      },
    },
  );

  container.bindFactory(token, () => delegate as T, { scope: 'singleton' });
}

bindToCurrent(Clock, (f) => f.clock);
bindToCurrent(IdGenerator, (f) => f.ids);
bindToCurrent(UserRepository, (f) => f.users);
bindToCurrent(MealRepository, (f) => f.meals);
bindToCurrent(RecipeRepository, (f) => f.recipes);
bindToCurrent(SavedMealRepository, (f) => f.savedMeals);
bindToCurrent(GetProfileQuery, (f) => f.getProfile);
bindToCurrent(GetMealQuery, (f) => f.getMeal);
bindToCurrent(ListMealsByDayQuery, (f) => f.listMealsByDay);
bindToCurrent(ListRecipesQuery, (f) => f.listRecipes);
bindToCurrent(ListSavedMealsQuery, (f) => f.listSavedMeals);
bindToCurrent(UserIdResolver, (f) => f.userIdResolver);
bindToCurrent(AuthProvider, (f) => f.auth);
bindToCurrent(FileStorage, (f) => f.storage);
bindToCurrent(MealAnalyzer, (f) => f.analyzer);
bindToCurrent(Transcriber, (f) => f.transcriber);
bindToCurrent(RecipeGenerator, (f) => f.recipeGenerator);
bindToCurrent(MealProcessingQueue, (f) => f.queue);
bindToCurrent(EmailSender, (f) => f.emails);

beforeEach(() => {
  current = createFakes();
});

export function givenSignedInUser(
  overrides: Parameters<typeof buildUser>[0] = {},
): User {
  const user = buildUser(overrides);
  current.db.putUser(user);
  current.auth.addAccount({
    externalId: user.externalId,
    email: user.email,
    password: 'senha-atual',
  });

  return user;
}

type HttpHandler = (
  event: APIGatewayProxyEventV2,
) => Promise<APIGatewayProxyResultV2>;

type HttpRequest = {
  as?: User | { externalId: string };
  body?: unknown;
  rawBody?: string;
  isBase64Encoded?: boolean;
  params?: Record<string, string>;
  query?: Record<string, string>;
  acceptLanguage?: string;
};

export type HttpResult = {
  statusCode: number;
  body: unknown;
};

export async function invoke(
  handler: HttpHandler,
  request: HttpRequest = {},
): Promise<HttpResult> {
  const event = {
    version: '2.0',
    rawPath: '/',
    headers: {
      'content-type': 'application/json',
      ...(request.acceptLanguage && {
        'accept-language': request.acceptLanguage,
      }),
    },
    body:
      request.rawBody ??
      (request.body === undefined ? undefined : JSON.stringify(request.body)),
    isBase64Encoded: request.isBase64Encoded ?? false,
    pathParameters: request.params,
    queryStringParameters: request.query,
    requestContext: request.as
      ? {
          authorizer: {
            jwt: { claims: { sub: request.as.externalId }, scopes: [] },
          },
        }
      : {},
  };

  const result = await handler(event as unknown as APIGatewayProxyEventV2);

  if (typeof result === 'string') {
    return { statusCode: 200, body: JSON.parse(result) };
  }

  return {
    statusCode: result.statusCode ?? 200,
    body: result.body === undefined ? undefined : JSON.parse(result.body),
  };
}

export function errorBody(code: string) {
  return { error: { code, message: expect.any(String) } };
}

export function validationErrorBody(...fields: string[]) {
  return {
    error: {
      code: 'VALIDATION',
      message: 'Invalid request.',
      details: expect.arrayContaining(
        fields.map((field) => expect.objectContaining({ field })),
      ),
    },
  };
}

export function s3Event(key: string): S3ObjectCreatedNotificationEvent {
  return {
    detail: { object: { key } },
  } as unknown as S3ObjectCreatedNotificationEvent;
}

export function sqsEvent(
  ...messages: { id: string; body: unknown }[]
): SQSEvent {
  return {
    Records: messages.map(({ id, body }) => ({
      messageId: id,
      body: JSON.stringify(body),
    })),
  } as unknown as SQSEvent;
}

export type { SQSBatchResponse };
