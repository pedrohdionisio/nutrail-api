import { AuthProvider } from '@/application/ports/AuthProvider';
import { Injectable } from '@/kernel/decorators/Injectable';

@Injectable()
export class ForgotPasswordUseCase {
  constructor(private readonly auth: AuthProvider) {}

  execute(email: string): Promise<void> {
    return this.auth.forgotPassword(email);
  }
}
