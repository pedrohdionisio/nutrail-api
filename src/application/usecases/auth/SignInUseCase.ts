import {
  AuthProvider,
  type AuthTokens,
  type Credentials,
} from '@/application/ports/AuthProvider';
import { Injectable } from '@/kernel/decorators/Injectable';

@Injectable()
export class SignInUseCase {
  constructor(private readonly auth: AuthProvider) {}

  execute(credentials: Credentials): Promise<AuthTokens> {
    return this.auth.signIn(credentials);
  }
}
