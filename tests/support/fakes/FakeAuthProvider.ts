import { EmailAlreadyInUseError } from '@/application/errors/EmailAlreadyInUseError';
import { InvalidCodeError } from '@/application/errors/InvalidCodeError';
import { InvalidCredentialsError } from '@/application/errors/InvalidCredentialsError';
import { InvalidCurrentPasswordError } from '@/application/errors/InvalidCurrentPasswordError';
import { InvalidRefreshTokenError } from '@/application/errors/InvalidRefreshTokenError';
import type {
  AuthProvider,
  AuthTokens,
  Credentials,
} from '@/application/ports/AuthProvider';

type Account = { externalId: string; email: string; password: string };

export const RESET_CODE = '123456';

export class FakeAuthProvider implements AuthProvider {
  readonly accounts = new Map<string, Account>();
  readonly resetRequests: string[] = [];
  readonly deletedExternalIds: string[] = [];
  private count = 0;

  addAccount(account: Account): void {
    this.accounts.set(account.email, account);
  }

  async signUp({
    email,
    password,
  }: Credentials): Promise<{ externalId: string }> {
    if (this.accounts.has(email)) {
      throw new EmailAlreadyInUseError();
    }

    this.count += 1;
    const externalId = `sub-new-${this.count}`;
    this.addAccount({ externalId, email, password });

    return { externalId };
  }

  async signIn({ email, password }: Credentials): Promise<AuthTokens> {
    const account = this.accounts.get(email);

    if (account?.password !== password) {
      throw new InvalidCredentialsError();
    }

    return tokensFor(account.externalId);
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const account = [...this.accounts.values()].find(
      ({ externalId }) => refreshToken === `refresh-${externalId}`,
    );

    if (!account) {
      throw new InvalidRefreshTokenError();
    }

    return tokensFor(account.externalId);
  }

  async forgotPassword(email: string): Promise<void> {
    this.resetRequests.push(email);
  }

  async confirmForgotPassword({
    email,
    code,
    password,
  }: {
    email: string;
    code: string;
    password: string;
  }): Promise<void> {
    const account = this.accounts.get(email);

    if (!account || code !== RESET_CODE) {
      throw new InvalidCodeError();
    }

    account.password = password;
  }

  async changePassword({
    email,
    currentPassword,
    newPassword,
  }: {
    externalId: string;
    email: string;
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    const account = this.accounts.get(email);

    if (account?.password !== currentPassword) {
      throw new InvalidCurrentPasswordError();
    }

    account.password = newPassword;
  }

  async deleteUser(externalId: string): Promise<void> {
    this.deletedExternalIds.push(externalId);

    for (const [email, account] of this.accounts) {
      if (account.externalId === externalId) this.accounts.delete(email);
    }
  }
}

function tokensFor(externalId: string): AuthTokens {
  return {
    accessToken: `access-${externalId}`,
    refreshToken: `refresh-${externalId}`,
  };
}
