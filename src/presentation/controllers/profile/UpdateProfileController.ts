import { UpdateProfileUseCase } from '@/application/usecases/profile/UpdateProfileUseCase';
import { Injectable } from '@/kernel/decorators/Injectable';
import { Schema } from '@/kernel/decorators/Schema';
import {
  Controller,
  type ControllerRequest,
  type ControllerResponse,
} from '../Controller';
import { type ProfileBody, profileSchema } from './schemas/profileSchema';

@Injectable()
@Schema(profileSchema)
export class UpdateProfileController extends Controller<
  'private',
  ProfileBody
> {
  constructor(private readonly updateProfile: UpdateProfileUseCase) {
    super();
  }

  protected async handle({
    userId,
    body,
  }: ControllerRequest<'private', ProfileBody>): Promise<ControllerResponse> {
    const result = await this.updateProfile.execute({ userId, profile: body });

    return { statusCode: 200, body: result };
  }
}
