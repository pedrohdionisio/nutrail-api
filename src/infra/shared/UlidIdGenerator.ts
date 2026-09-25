import { ulid } from 'ulid';
import type { IdGenerator } from '@/application/ports/IdGenerator';

export class UlidIdGenerator implements IdGenerator {
  generate(): string {
    return ulid();
  }
}
