import { ChangePasswordUseCase } from '@/application/usecases/account/ChangePasswordUseCase';
import { Injectable } from '@/kernel/decorators/Injectable';
import { Schema } from '@/kernel/decorators/Schema';
import {
  Controller,
  type ControllerRequest,
  type ControllerResponse,
} from '../Controller';
import {
  type ChangePasswordBody,
  changePasswordSchema,
} from './schemas/changePasswordSchema';

@Injectable()
@Schema(changePasswordSchema)
export class ChangePasswordController extends Controller<
  'private',
  ChangePasswordBody
> {
  constructor(private readonly changePassword: ChangePasswordUseCase) {
    super();
  }

  protected async handle({
    userId,
    body,
  }: ControllerRequest<
    'private',
    ChangePasswordBody
  >): Promise<ControllerResponse> {
    await this.changePassword.execute({ userId, ...body });

    return { statusCode: 204 };
  }
}
