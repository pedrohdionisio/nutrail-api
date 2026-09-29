import { AuthProvider } from '@/application/ports/AuthProvider';
import type { Language } from '@/domain/value-objects/Language';
import { Injectable } from '@/kernel/decorators/Injectable';

@Injectable()
export class ForgotPasswordUseCase {
  constructor(private readonly auth: AuthProvider) {}

  execute(input: { email: string; language: Language }): Promise<void> {
    return this.auth.forgotPassword(input);
  }
}
