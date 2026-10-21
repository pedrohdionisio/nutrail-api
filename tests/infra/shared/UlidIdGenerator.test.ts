import { describe, expect, it } from 'vitest';
import { UlidIdGenerator } from '@/infra/shared/UlidIdGenerator';

describe('UlidIdGenerator', () => {
  it('should generate unique ULIDs that sort by creation, even within the same millisecond', () => {
    const ids = new UlidIdGenerator();

    const generated = Array.from({ length: 100 }, () => ids.generate());

    expect(generated[0]).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    expect(new Set(generated).size).toBe(100);
    expect([...generated].sort()).toEqual(generated);
  });
});
