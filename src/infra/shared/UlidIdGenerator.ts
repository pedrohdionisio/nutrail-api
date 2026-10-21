import { monotonicFactory } from 'ulid';
import type { IdGenerator } from '@/application/ports/IdGenerator';

export class UlidIdGenerator implements IdGenerator {
  private readonly next = monotonicFactory();

  generate(): string {
    return this.next();
  }
}
