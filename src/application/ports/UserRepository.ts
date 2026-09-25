import type { User } from '@/domain/entities/User';

export abstract class UserRepository {
  abstract findById(id: string): Promise<User | null>;

  abstract create(user: User): Promise<void>;

  abstract update(user: User): Promise<void>;

  abstract deleteWithAllData(id: string): Promise<void>;
}
