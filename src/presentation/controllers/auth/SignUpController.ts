import { SignUpUseCase } from '@/application/usecases/auth/SignUpUseCase';
import { Injectable } from '@/kernel/decorators/Injectable';
import { Schema } from '@/kernel/decorators/Schema';
import {
  Controller,
  type ControllerRequest,
  type ControllerResponse,
} from '../Controller';
import { type SignUpBody, signUpSchema } from './schemas/signUpSchema';

@Injectable()
@Schema(signUpSchema)
export class SignUpController extends Controller<'public', SignUpBody> {
  constructor(private readonly signUp: SignUpUseCase) {
    super();
  }

  protected async handle({
    body,
  }: ControllerRequest<'public', SignUpBody>): Promise<ControllerResponse> {
    const tokens = await this.signUp.execute(body);

    return { statusCode: 201, body: tokens };
  }
}
