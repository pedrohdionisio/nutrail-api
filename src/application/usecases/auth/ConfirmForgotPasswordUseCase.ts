import { AuthProvider } from '@/application/ports/AuthProvider';
import { Injectable } from '@/kernel/decorators/Injectable';

type Input = {
  email: string;
  code: string;
  password: string;
};

@Injectable()
export class ConfirmForgotPasswordUseCase {
  constructor(private readonly auth: AuthProvider) {}

  execute(input: Input): Promise<void> {
    return this.auth.confirmForgotPassword(input);
  }
}
