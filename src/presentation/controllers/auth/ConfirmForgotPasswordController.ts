import { ConfirmForgotPasswordUseCase } from '@/application/usecases/auth/ConfirmForgotPasswordUseCase';
import { Injectable } from '@/kernel/decorators/Injectable';
import { Schema } from '@/kernel/decorators/Schema';
import {
  Controller,
  type ControllerRequest,
  type ControllerResponse,
} from '../Controller';
import {
  type ConfirmForgotPasswordBody,
  confirmForgotPasswordSchema,
} from './schemas/confirmForgotPasswordSchema';

@Injectable()
@Schema(confirmForgotPasswordSchema)
export class ConfirmForgotPasswordController extends Controller<
  'public',
  ConfirmForgotPasswordBody
> {
  constructor(
    private readonly confirmForgotPassword: ConfirmForgotPasswordUseCase,
  ) {
    super();
  }

  protected async handle({
    body,
  }: ControllerRequest<
    'public',
    ConfirmForgotPasswordBody
  >): Promise<ControllerResponse> {
    await this.confirmForgotPassword.execute(body);

    return { statusCode: 204 };
  }
}
