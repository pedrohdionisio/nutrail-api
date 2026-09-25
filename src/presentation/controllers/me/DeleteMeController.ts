import { DeleteAccountUseCase } from '@/application/usecases/account/DeleteAccountUseCase';
import { Injectable } from '@/kernel/decorators/Injectable';
import {
  Controller,
  type ControllerRequest,
  type ControllerResponse,
} from '../Controller';

@Injectable()
export class DeleteMeController extends Controller<'private'> {
  constructor(private readonly deleteAccount: DeleteAccountUseCase) {
    super();
  }

  protected async handle({
    userId,
  }: ControllerRequest<'private'>): Promise<ControllerResponse> {
    await this.deleteAccount.execute(userId);

    return { statusCode: 204 };
  }
}
