import { GetProfileQuery } from '@/application/ports/GetProfileQuery';
import { Injectable } from '@/kernel/decorators/Injectable';
import { HttpError } from '@/presentation/errors/HttpError';
import {
  Controller,
  type ControllerRequest,
  type ControllerResponse,
} from '../Controller';

@Injectable()
export class GetMeController extends Controller<'private'> {
  constructor(private readonly getProfile: GetProfileQuery) {
    super();
  }

  protected async handle({
    userId,
  }: ControllerRequest<'private'>): Promise<ControllerResponse> {
    const me = await this.getProfile.execute(userId);

    if (!me) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found.');
    }

    return { statusCode: 200, body: me };
  }
}
