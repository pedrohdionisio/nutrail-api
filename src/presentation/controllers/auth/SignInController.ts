import { SignInUseCase } from '@/application/usecases/auth/SignInUseCase';
import { Injectable } from '@/kernel/decorators/Injectable';
import { Schema } from '@/kernel/decorators/Schema';
import {
  Controller,
  type ControllerRequest,
  type ControllerResponse,
} from '../Controller';
import { type SignInBody, signInSchema } from './schemas/signInSchema';

@Injectable()
@Schema(signInSchema)
export class SignInController extends Controller<'public', SignInBody> {
  constructor(private readonly signIn: SignInUseCase) {
    super();
  }

  protected async handle({
    body,
  }: ControllerRequest<'public', SignInBody>): Promise<ControllerResponse> {
    const tokens = await this.signIn.execute(body);

    return { statusCode: 200, body: tokens };
  }
}
