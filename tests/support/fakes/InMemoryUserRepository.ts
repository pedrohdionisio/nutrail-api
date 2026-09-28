import type { UserRepository } from '@/application/ports/UserRepository';
import type { User } from '@/domain/entities/User';
import { copyUser, type InMemoryDatabase } from './InMemoryDatabase';

export class InMemoryUserRepository implements UserRepository {
  constructor(private readonly db: InMemoryDatabase) {}

  async findById(id: string): Promise<User | null> {
    const user = this.db.users.get(id);

    return user ? copyUser(user) : null;
  }

  async create(user: User): Promise<void> {
    if (this.db.users.has(user.id)) {
      throw new Error(`User ${user.id} already exists.`);
    }

    this.db.putUser(user);
  }

  async update(user: User): Promise<void> {
    if (!this.db.users.has(user.id)) {
      throw new Error(`User ${user.id} does not exist.`);
    }

    this.db.putUser(user);
  }

  async deleteWithAllData(id: string): Promise<void> {
    this.db.users.delete(id);

    for (const table of [this.db.meals, this.db.recipes, this.db.savedMeals]) {
      for (const [key, item] of table) {
        if (item.userId === id) table.delete(key);
      }
    }
  }
}
