import type { UserProfile } from '@/domain/entities/User';
import type { Macros } from '@/domain/value-objects/Macros';

export type ProfileWithGoals = {
  profile: UserProfile & { email: string };
  goals: Macros;
};

export abstract class GetProfileQuery {
  abstract execute(userId: string): Promise<ProfileWithGoals | null>;
}
