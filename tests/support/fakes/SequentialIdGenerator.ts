import type { IdGenerator } from '@/application/ports/IdGenerator';

export class SequentialIdGenerator implements IdGenerator {
  private count = 0;

  constructor(private readonly prefix = 'id') {}

  generate(): string {
    this.count += 1;

    return `${this.prefix}-${this.count}`;
  }
}
