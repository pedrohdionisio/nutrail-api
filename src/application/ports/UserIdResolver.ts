export abstract class UserIdResolver {
  abstract resolve(externalId: string): Promise<string | null>;
}
