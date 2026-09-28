import {
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminSetUserPasswordCommand,
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
import { mockClient } from 'aws-sdk-client-mock';
import { describe, expect, it } from 'vitest';
import { EmailAlreadyInUseError } from '@/application/errors/EmailAlreadyInUseError';
import { InvalidCodeError } from '@/application/errors/InvalidCodeError';
import { InvalidCredentialsError } from '@/application/errors/InvalidCredentialsError';
import { InvalidCurrentPasswordError } from '@/application/errors/InvalidCurrentPasswordError';
import { InvalidRefreshTokenError } from '@/application/errors/InvalidRefreshTokenError';
import { TooManyAttemptsError } from '@/application/errors/TooManyAttemptsError';
import { CognitoAuthProvider } from '@/infra/auth/CognitoAuthProvider';
import { AppConfig } from '@/shared/config/AppConfig';

const POOL = 'us-east-1_test';
const CLIENT = 'test-client';
const META = { message: 'cognito error', $metadata: {} };

function setup() {
  const client = new CognitoIdentityProviderClient({});

  return {
    mock: mockClient(client),
    auth: new CognitoAuthProvider(client, new AppConfig()),
  };
}

describe('CognitoAuthProvider', () => {
  describe('signUp', () => {
    it('should create a confirmed user with a permanent password and return its sub', async () => {
      const { mock, auth } = setup();
      mock.on(AdminCreateUserCommand).resolves({
        User: { Attributes: [{ Name: 'sub', Value: 'sub-9' }] },
      });
      mock.on(AdminSetUserPasswordCommand).resolves({});

      expect(
        await auth.signUp({
          email: 'ana@nutrail.test',
          password: 'senha-forte',
        }),
      ).toEqual({
        externalId: 'sub-9',
      });
      expect(
        mock.commandCalls(AdminCreateUserCommand)[0]?.args[0].input,
      ).toEqual({
        UserPoolId: POOL,
        Username: 'ana@nutrail.test',
        MessageAction: 'SUPPRESS',
        UserAttributes: [
          { Name: 'email', Value: 'ana@nutrail.test' },
          { Name: 'email_verified', Value: 'true' },
        ],
      });
      expect(
        mock.commandCalls(AdminSetUserPasswordCommand)[0]?.args[0].input,
      ).toEqual({
        UserPoolId: POOL,
        Username: 'sub-9',
        Password: 'senha-forte',
        Permanent: true,
      });
    });

    it('should translate an existing username into email already in use', async () => {
      const { mock, auth } = setup();
      mock
        .on(AdminCreateUserCommand)
        .rejects(new UsernameExistsException(META));

      await expect(
        auth.signUp({ email: 'ana@nutrail.test', password: 'x' }),
      ).rejects.toThrow(EmailAlreadyInUseError);
    });

    it('should delete the created user when the password is refused', async () => {
      const { mock, auth } = setup();
      mock.on(AdminCreateUserCommand).resolves({
        User: { Attributes: [{ Name: 'sub', Value: 'sub-9' }] },
      });
      mock
        .on(AdminSetUserPasswordCommand)
        .rejects(new Error('InvalidPasswordException'));
      mock.on(AdminDeleteUserCommand).resolves({});

      await expect(
        auth.signUp({ email: 'ana@nutrail.test', password: 'x' }),
      ).rejects.toThrow('InvalidPasswordException');
      expect(
        mock.commandCalls(AdminDeleteUserCommand)[0]?.args[0].input,
      ).toEqual({
        UserPoolId: POOL,
        Username: 'sub-9',
      });
    });

    it('should fail when Cognito does not return the sub', async () => {
      const { mock, auth } = setup();
      mock.on(AdminCreateUserCommand).resolves({ User: { Attributes: [] } });

      await expect(
        auth.signUp({ email: 'ana@nutrail.test', password: 'x' }),
      ).rejects.toThrow('Cognito did not return the user sub.');
    });
  });

  describe('signIn', () => {
    it('should authenticate with the user password flow', async () => {
      const { mock, auth } = setup();
      mock.on(InitiateAuthCommand).resolves({
        AuthenticationResult: {
          AccessToken: 'access',
          RefreshToken: 'refresh',
        },
      });

      expect(
        await auth.signIn({ email: 'ana@nutrail.test', password: 'senha' }),
      ).toEqual({
        accessToken: 'access',
        refreshToken: 'refresh',
      });
      expect(mock.commandCalls(InitiateAuthCommand)[0]?.args[0].input).toEqual({
        ClientId: CLIENT,
        AuthFlow: 'USER_PASSWORD_AUTH',
        AuthParameters: { USERNAME: 'ana@nutrail.test', PASSWORD: 'senha' },
      });
    });

    it.each([
      new NotAuthorizedException(META),
      new UserNotFoundException(META),
    ])('should translate %s into invalid credentials', async (error) => {
      const { mock, auth } = setup();
      mock.on(InitiateAuthCommand).rejects(error);

      await expect(
        auth.signIn({ email: 'ana@nutrail.test', password: 'x' }),
      ).rejects.toThrow(InvalidCredentialsError);
    });

    it('should fail when the tokens are missing', async () => {
      const { mock, auth } = setup();
      mock
        .on(InitiateAuthCommand)
        .resolves({ AuthenticationResult: { AccessToken: 'access' } });

      await expect(
        auth.signIn({ email: 'ana@nutrail.test', password: 'x' }),
      ).rejects.toThrow('Cognito did not return the expected tokens.');
    });
  });

  describe('refreshToken', () => {
    it('should keep the same refresh token when Cognito does not rotate it', async () => {
      const { mock, auth } = setup();
      mock
        .on(InitiateAuthCommand)
        .resolves({ AuthenticationResult: { AccessToken: 'new-access' } });

      expect(await auth.refreshToken('refresh')).toEqual({
        accessToken: 'new-access',
        refreshToken: 'refresh',
      });
      expect(
        mock.commandCalls(InitiateAuthCommand)[0]?.args[0].input,
      ).toMatchObject({
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        AuthParameters: { REFRESH_TOKEN: 'refresh' },
      });
    });

    it('should translate a refused token into invalid refresh token', async () => {
      const { mock, auth } = setup();
      mock.on(InitiateAuthCommand).rejects(new NotAuthorizedException(META));

      await expect(auth.refreshToken('expired')).rejects.toThrow(
        InvalidRefreshTokenError,
      );
    });
  });

  describe('forgotPassword', () => {
    it('should ask Cognito to send the code', async () => {
      const { mock, auth } = setup();
      mock.on(ForgotPasswordCommand).resolves({});

      await auth.forgotPassword('ana@nutrail.test');

      expect(
        mock.commandCalls(ForgotPasswordCommand)[0]?.args[0].input,
      ).toEqual({
        ClientId: CLIENT,
        Username: 'ana@nutrail.test',
      });
    });

    it('should translate the rate limit into too many attempts', async () => {
      const { mock, auth } = setup();
      mock.on(ForgotPasswordCommand).rejects(new LimitExceededException(META));

      await expect(auth.forgotPassword('ana@nutrail.test')).rejects.toThrow(
        TooManyAttemptsError,
      );
    });
  });

  describe('confirmForgotPassword', () => {
    const INPUT = {
      email: 'ana@nutrail.test',
      code: '123456',
      password: 'nova-senha',
    };

    it('should confirm the new password with the code', async () => {
      const { mock, auth } = setup();
      mock.on(ConfirmForgotPasswordCommand).resolves({});

      await auth.confirmForgotPassword(INPUT);

      expect(
        mock.commandCalls(ConfirmForgotPasswordCommand)[0]?.args[0].input,
      ).toEqual({
        ClientId: CLIENT,
        Username: 'ana@nutrail.test',
        ConfirmationCode: '123456',
        Password: 'nova-senha',
      });
    });

    it.each([
      [new CodeMismatchException(META), InvalidCodeError],
      [new ExpiredCodeException(META), InvalidCodeError],
      [new LimitExceededException(META), TooManyAttemptsError],
    ])('should translate %s', async (error, expected) => {
      const { mock, auth } = setup();
      mock.on(ConfirmForgotPasswordCommand).rejects(error);

      await expect(auth.confirmForgotPassword(INPUT)).rejects.toThrow(expected);
    });
  });

  describe('changePassword', () => {
    const INPUT = {
      externalId: 'sub-1',
      email: 'ana@nutrail.test',
      currentPassword: 'atual',
      newPassword: 'nova-senha',
    };

    it('should check the current password before setting the new one', async () => {
      const { mock, auth } = setup();
      mock
        .on(InitiateAuthCommand)
        .resolves({ AuthenticationResult: { AccessToken: 'a' } });
      mock.on(AdminSetUserPasswordCommand).resolves({});

      await auth.changePassword(INPUT);

      expect(
        mock.commandCalls(InitiateAuthCommand)[0]?.args[0].input.AuthParameters,
      ).toEqual({
        USERNAME: 'ana@nutrail.test',
        PASSWORD: 'atual',
      });
      expect(
        mock.commandCalls(AdminSetUserPasswordCommand)[0]?.args[0].input,
      ).toEqual({
        UserPoolId: POOL,
        Username: 'sub-1',
        Password: 'nova-senha',
        Permanent: true,
      });
    });

    it('should refuse a wrong current password without changing anything', async () => {
      const { mock, auth } = setup();
      mock.on(InitiateAuthCommand).rejects(new NotAuthorizedException(META));

      await expect(auth.changePassword(INPUT)).rejects.toThrow(
        InvalidCurrentPasswordError,
      );
      expect(mock.commandCalls(AdminSetUserPasswordCommand)).toHaveLength(0);
    });
  });

  describe('deleteUser', () => {
    it('should treat a user that no longer exists as deleted', async () => {
      const { mock, auth } = setup();
      mock.on(AdminDeleteUserCommand).rejects(new UserNotFoundException(META));

      await expect(auth.deleteUser('sub-1')).resolves.toBeUndefined();
    });

    it('should propagate other errors', async () => {
      const { mock, auth } = setup();
      mock.on(AdminDeleteUserCommand).rejects(new Error('throttled'));

      await expect(auth.deleteUser('sub-1')).rejects.toThrow('throttled');
    });
  });
});
