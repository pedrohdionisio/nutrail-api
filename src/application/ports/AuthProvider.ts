export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type Credentials = {
  email: string;
  password: string;
};

export abstract class AuthProvider {
  abstract signUp(credentials: Credentials): Promise<{ externalId: string }>;

  abstract signIn(credentials: Credentials): Promise<AuthTokens>;

  abstract refreshToken(refreshToken: string): Promise<AuthTokens>;

  abstract forgotPassword(email: string): Promise<void>;

  abstract confirmForgotPassword(input: {
    email: string;
    code: string;
    password: string;
  }): Promise<void>;

  abstract deleteUser(externalId: string): Promise<void>;
}
