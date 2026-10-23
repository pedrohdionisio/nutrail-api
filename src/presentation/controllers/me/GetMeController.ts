import { GetProfileQuery } from '@/application/ports/GetProfileQuery';
import { DAILY_LIMITS } from '@/application/services/DailyQuota';
import { planOf } from '@/domain/entities/Subscription';
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

    const plan = planOf(me.subscription?.status ?? null);
    const limits = DAILY_LIMITS[plan];

    return {
      statusCode: 200,
      body: {
        profile: me.profile,
        goals: me.goals,
        subscription: {
          plan,
          cancelAt: me.subscription?.cancelAt ?? null,
        },
        dailyLimits: {
          mealAnalyses: limits.MEAL_ANALYSIS,
          recipes: limits.RECIPE,
        },
      },
    };
  }
}
