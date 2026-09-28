import { describe, expect, it } from 'vitest';
import { handler } from '@/main/functions/health';
import { invoke } from '../../support/app';

describe('GET /health', () => {
  it('should answer ok without authentication', async () => {
    expect(await invoke(handler)).toEqual({
      statusCode: 200,
      body: { status: 'ok' },
    });
  });
});
