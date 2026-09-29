import { ForgotPasswordUseCase } from '@/application/usecases/auth/ForgotPasswordUseCase';
import { Injectable } from '@/kernel/decorators/Injectable';
import { Schema } from '@/kernel/decorators/Schema';
import {
  Controller,
  type ControllerRequest,
  type ControllerResponse,
} from '../Controller';
import {
  type ForgotPasswordBody,
  forgotPasswordSchema,
} from './schemas/forgotPasswordSchema';

@Injectable()
@Schema(forgotPasswordSchema)
export class ForgotPasswordController extends Controller<
  'public',
  ForgotPasswordBody
> {
  constructor(private readonly forgotPassword: ForgotPasswordUseCase) {
    super();
  }

  protected async handle({
    body,
    language,
  }: ControllerRequest<
    'public',
    ForgotPasswordBody
  >): Promise<ControllerResponse> {
    await this.forgotPassword.execute({ email: body.email, language });

    return { statusCode: 204 };
  }
}
