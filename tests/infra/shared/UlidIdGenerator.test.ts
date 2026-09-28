import { describe, expect, it } from 'vitest';
import { UlidIdGenerator } from '@/infra/shared/UlidIdGenerator';

describe('UlidIdGenerator', () => {
  it('should generate unique ULIDs that sort by creation', () => {
    const ids = new UlidIdGenerator();

    const first = ids.generate();
    const second = ids.generate();

    expect(first).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    expect(second).not.toBe(first);
    expect([second, first].sort()).toEqual([first, second]);
  });
});
