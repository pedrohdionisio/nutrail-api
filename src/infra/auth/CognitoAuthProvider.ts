import {
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminSetUserPasswordCommand,
  type AuthenticationResultType,
  CodeMismatchException,
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  ExpiredCodeException,
  ForgotPasswordCommand,
  InitiateAuthCommand,
  LimitExceededException,
  NotAuthorizedException,
  UserNotFoundException,
  UsernameExistsException,
} from '@aws-sdk/client-cognito-identity-provider';
import { EmailAlreadyInUseError } from '@/application/errors/EmailAlreadyInUseError';
import { InvalidCodeError } from '@/application/errors/InvalidCodeError';
import { InvalidCredentialsError } from '@/application/errors/InvalidCredentialsError';
import { InvalidRefreshTokenError } from '@/application/errors/InvalidRefreshTokenError';
import { TooManyAttemptsError } from '@/application/errors/TooManyAttemptsError';
import type {
  AuthProvider,
  AuthTokens,
  Credentials,
} from '@/application/ports/AuthProvider';
import { Injectable } from '@/kernel/decorators/Injectable';
import { AppConfig } from '@/shared/config/AppConfig';

@Injectable()
export class CognitoAuthProvider implements AuthProvider {
  constructor(
    private readonly client: CognitoIdentityProviderClient,
    private readonly config: AppConfig,
  ) {}

  async signUp({ email, password }: Credentials) {
    const externalId = await this.createUser(email);

    try {
      await this.client.send(
        new AdminSetUserPasswordCommand({
          UserPoolId: this.config.cognito.userPoolId,
          Username: externalId,
          Password: password,
          Permanent: true,
        }),
      );
    } catch (error) {
      await this.deleteUser(externalId);

      throw error;
    }

    return { externalId };
  }

  async signIn({ email, password }: Credentials): Promise<AuthTokens> {
    try {
      const { AuthenticationResult } = await this.client.send(
        new InitiateAuthCommand({
          ClientId: this.config.cognito.clientId,
          AuthFlow: 'USER_PASSWORD_AUTH',
          AuthParameters: { USERNAME: email, PASSWORD: password },
        }),
      );

      return toTokens(AuthenticationResult);
    } catch (error) {
      if (
        error instanceof NotAuthorizedException ||
        error instanceof UserNotFoundException
      ) {
        throw new InvalidCredentialsError();
      }

      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const { AuthenticationResult } = await this.client.send(
        new InitiateAuthCommand({
          ClientId: this.config.cognito.clientId,
          AuthFlow: 'REFRESH_TOKEN_AUTH',
          AuthParameters: { REFRESH_TOKEN: refreshToken },
        }),
      );

      return toTokens(AuthenticationResult, refreshToken);
    } catch (error) {
      if (error instanceof NotAuthorizedException) {
        throw new InvalidRefreshTokenError();
      }

      throw error;
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      await this.client.send(
        new ForgotPasswordCommand({
          ClientId: this.config.cognito.clientId,
          Username: email,
        }),
      );
    } catch (error) {
      if (error instanceof LimitExceededException) {
        throw new TooManyAttemptsError();
      }

      throw error;
    }
  }

  async confirmForgotPassword(input: {
    email: string;
    code: string;
    password: string;
  }): Promise<void> {
    try {
      await this.client.send(
        new ConfirmForgotPasswordCommand({
          ClientId: this.config.cognito.clientId,
          Username: input.email,
          ConfirmationCode: input.code,
          Password: input.password,
        }),
      );
    } catch (error) {
      if (
        error instanceof CodeMismatchException ||
        error instanceof ExpiredCodeException
      ) {
        throw new InvalidCodeError();
      }

      if (error instanceof LimitExceededException) {
        throw new TooManyAttemptsError();
      }

      throw error;
    }
  }

  async deleteUser(externalId: string): Promise<void> {
    await this.client.send(
      new AdminDeleteUserCommand({
        UserPoolId: this.config.cognito.userPoolId,
        Username: externalId,
      }),
    );
  }

  private async createUser(email: string): Promise<string> {
    try {
      const { User } = await this.client.send(
        new AdminCreateUserCommand({
          UserPoolId: this.config.cognito.userPoolId,
          Username: email,
          MessageAction: 'SUPPRESS',
          UserAttributes: [
            { Name: 'email', Value: email },
            { Name: 'email_verified', Value: 'true' },
          ],
        }),
      );

      const sub = User?.Attributes?.find(({ Name }) => Name === 'sub')?.Value;

      if (!sub) {
        throw new Error('Cognito did not return the user sub.');
      }

      return sub;
    } catch (error) {
      if (error instanceof UsernameExistsException) {
        throw new EmailAlreadyInUseError();
      }

      throw error;
    }
  }
}

function toTokens(
  result: AuthenticationResultType | undefined,
  fallbackRefreshToken?: string,
): AuthTokens {
  const accessToken = result?.AccessToken;
  const refreshToken = result?.RefreshToken ?? fallbackRefreshToken;

  if (!accessToken || !refreshToken) {
    throw new Error('Cognito did not return the expected tokens.');
  }

  return { accessToken, refreshToken };
}
