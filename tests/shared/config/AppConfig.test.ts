import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppConfig } from '@/shared/config/AppConfig';

describe('AppConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should read the configuration from the environment', () => {
    const config = new AppConfig();

    expect(config.tableName).toBe('nutrail-test');
    expect(config.cognito).toEqual({
      userPoolId: 'us-east-1_test',
      clientId: 'test-client',
    });
  });

  it('should name the missing variable', () => {
    vi.stubEnv('MEAL_QUEUE_URL', '');

    expect(() => new AppConfig()).toThrow(
      'Missing environment variable MEAL_QUEUE_URL.',
    );
  });
});
