import { RefreshTokenUseCase } from '@/application/usecases/auth/RefreshTokenUseCase';
import { Injectable } from '@/kernel/decorators/Injectable';
import { Schema } from '@/kernel/decorators/Schema';
import {
  Controller,
  type ControllerRequest,
  type ControllerResponse,
} from '../Controller';
import {
  type RefreshTokenBody,
  refreshTokenSchema,
} from './schemas/refreshTokenSchema';

@Injectable()
@Schema(refreshTokenSchema)
export class RefreshTokenController extends Controller<
  'public',
  RefreshTokenBody
> {
  constructor(private readonly refreshToken: RefreshTokenUseCase) {
    super();
  }

  protected async handle({
    body,
  }: ControllerRequest<
    'public',
    RefreshTokenBody
  >): Promise<ControllerResponse> {
    const tokens = await this.refreshToken.execute(body.refreshToken);

    return { statusCode: 200, body: tokens };
  }
}
