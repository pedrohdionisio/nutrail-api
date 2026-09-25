import {
  AuthProvider,
  type AuthTokens,
} from '@/application/ports/AuthProvider';
import { Injectable } from '@/kernel/decorators/Injectable';

@Injectable()
export class RefreshTokenUseCase {
  constructor(private readonly auth: AuthProvider) {}

  execute(refreshToken: string): Promise<AuthTokens> {
    return this.auth.refreshToken(refreshToken);
  }
}
