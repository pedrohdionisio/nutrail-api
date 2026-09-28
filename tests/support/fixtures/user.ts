import { User, type UserProfile } from '@/domain/entities/User';

type UserOverrides = Partial<ConstructorParameters<typeof User>[0]>;

export function buildProfile(
  overrides: Partial<UserProfile> = {},
): UserProfile {
  return {
    name: 'Ana Souza',
    gender: 'FEMALE',
    birthDate: '1995-03-10',
    height: 165,
    weight: 60,
    goal: 'LOSE',
    activityLevel: 'MODERATE',
    ...overrides,
  };
}

export function buildUser(overrides: UserOverrides = {}): User {
  return new User({
    ...buildProfile(),
    id: 'user-1',
    externalId: 'sub-1',
    email: 'ana@nutrail.test',
    goals: { calories: 1800, protein: 120, carbohydrate: 204, fat: 54 },
    createdAt: '2026-09-01T12:00:00.000Z',
    ...overrides,
  });
}
