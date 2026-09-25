import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2,
} from 'aws-lambda';
import { ZodError } from 'zod';
import { ApplicationError } from '@/application/errors/ApplicationError';
import { UserIdResolver } from '@/application/ports/UserIdResolver';
import { DomainError } from '@/domain/errors/DomainError';
import type { Token } from '@/kernel/di/Container';
import type { Access, Controller } from '@/presentation/controllers/Controller';
import { HttpError } from '@/presentation/errors/HttpError';
import { container } from '../container';

type HttpEvent =
  | APIGatewayProxyEventV2
  | APIGatewayProxyEventV2WithJWTAuthorizer;

export function lambdaHttpAdapter(
  controllerClass: Token<Controller<Access, never>>,
) {
  return async (event: HttpEvent): Promise<APIGatewayProxyResultV2> => {
    try {
      const controller = container.resolve(controllerClass);
      const userId = await resolveUserId(event);

      const response = await controller.execute({
        body: parseBody(event),
        params: event.pathParameters ?? {},
        queryParams: event.queryStringParameters ?? {},
        ...(userId !== undefined && { userId }),
      });

      return json(response.statusCode, response.body);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

async function resolveUserId(event: HttpEvent): Promise<string | undefined> {
  const sub =
    'authorizer' in event.requestContext
      ? event.requestContext.authorizer.jwt.claims.sub
      : undefined;
  if (typeof sub !== 'string') return undefined;

  const userId = await container.resolve(UserIdResolver).resolve(sub);
  if (!userId) {
    throw new HttpError(401, 'UNAUTHORIZED', 'Unauthorized.');
  }
  return userId;
}

function parseBody(event: HttpEvent): unknown {
  if (!event.body) return undefined;

  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf-8')
    : event.body;
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, 'INVALID_JSON', 'Request body is not valid JSON.');
  }
}

function toErrorResponse(error: unknown): APIGatewayProxyResultV2 {
  if (error instanceof ZodError) {
    return json(400, {
      error: {
        code: 'VALIDATION',
        message: 'Invalid request.',
        details: error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      },
    });
  }

  if (
    error instanceof HttpError ||
    error instanceof ApplicationError ||
    error instanceof DomainError
  ) {
    return json(error.statusCode, {
      error: { code: error.code, message: error.message },
    });
  }

  console.error(error);
  return json(500, {
    error: { code: 'INTERNAL', message: 'Internal server error.' },
  });
}

function json(statusCode: number, body: unknown): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}
