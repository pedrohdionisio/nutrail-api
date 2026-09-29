import type { Language } from '@/domain/value-objects/Language';
import { getSchema } from '@/kernel/decorators/Schema';

export type Access = 'public' | 'private';

export type ControllerRequest<TAccess extends Access, TBody = unknown> = {
  body: TBody;
  params: Record<string, string | undefined>;
  queryParams: Record<string, string | undefined>;
  language: Language;
} & (TAccess extends 'private' ? { userId: string } : Record<never, never>);

export type ControllerResponse = {
  statusCode: number;
  body?: unknown;
};

export abstract class Controller<TAccess extends Access, TBody = unknown> {
  protected abstract handle(
    request: ControllerRequest<TAccess, TBody>,
  ): Promise<ControllerResponse>;

  execute(
    request: ControllerRequest<'public'> & { userId?: string },
  ): Promise<ControllerResponse> {
    const schema = getSchema(this.constructor);
    const body = schema ? schema.parse(request.body) : request.body;

    return this.handle({ ...request, body } as ControllerRequest<
      TAccess,
      TBody
    >);
  }
}
