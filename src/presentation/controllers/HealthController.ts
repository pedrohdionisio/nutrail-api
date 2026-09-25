import { Injectable } from '@/kernel/decorators/Injectable';
import { Controller, type ControllerResponse } from './Controller';

@Injectable()
export class HealthController extends Controller<'public'> {
  protected async handle(): Promise<ControllerResponse> {
    return { statusCode: 200, body: { status: 'ok' } };
  }
}
