import { afterEach, describe, expect, it, vi } from 'vitest';
import { SystemClock } from '@/infra/shared/SystemClock';

describe('SystemClock', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return the current time', () => {
    vi.useFakeTimers({ now: new Date('2026-09-26T15:00:00.000Z') });

    expect(new SystemClock().now()).toEqual(
      new Date('2026-09-26T15:00:00.000Z'),
    );
  });
});
