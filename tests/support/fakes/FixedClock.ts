import type { Clock } from '@/application/ports/Clock';

export class FixedClock implements Clock {
  constructor(public current = new Date('2026-09-26T15:00:00.000Z')) {}

  now(): Date {
    return new Date(this.current);
  }
}
