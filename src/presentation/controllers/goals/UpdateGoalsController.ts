import { UpdateGoalsUseCase } from '@/application/usecases/goals/UpdateGoalsUseCase';
import { Injectable } from '@/kernel/decorators/Injectable';
import { Schema } from '@/kernel/decorators/Schema';
import {
  Controller,
  type ControllerRequest,
  type ControllerResponse,
} from '../Controller';
import { type GoalsBody, goalsSchema } from './schemas/goalsSchema';

@Injectable()
@Schema(goalsSchema)
export class UpdateGoalsController extends Controller<'private', GoalsBody> {
  constructor(private readonly updateGoals: UpdateGoalsUseCase) {
    super();
  }

  protected async handle({
    userId,
    body,
  }: ControllerRequest<'private', GoalsBody>): Promise<ControllerResponse> {
    const result = await this.updateGoals.execute({ userId, goals: body });

    return { statusCode: 200, body: result };
  }
}
