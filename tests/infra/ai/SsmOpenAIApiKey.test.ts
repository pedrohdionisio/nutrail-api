import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import { mockClient } from 'aws-sdk-client-mock';
import { describe, expect, it } from 'vitest';
import { SsmOpenAIApiKey } from '@/infra/ai/SsmOpenAIApiKey';
import { AppConfig } from '@/shared/config/AppConfig';

function createApiKey() {
  const client = new SSMClient({});
  const mock = mockClient(client);

  return { mock, apiKey: new SsmOpenAIApiKey(client, new AppConfig()) };
}

describe('SsmOpenAIApiKey', () => {
  it('should read the decrypted key from the configured parameter', async () => {
    const { mock, apiKey } = createApiKey();
    mock.on(GetParameterCommand).resolves({ Parameter: { Value: 'sk-test' } });

    await expect(apiKey.get()).resolves.toBe('sk-test');
    expect(mock.commandCalls(GetParameterCommand)[0]?.args[0].input).toEqual({
      Name: '/nutrail-api/test/openai-api-key',
      WithDecryption: true,
    });
  });

  it('should read the parameter only once', async () => {
    const { mock, apiKey } = createApiKey();
    mock.on(GetParameterCommand).resolves({ Parameter: { Value: 'sk-test' } });

    await Promise.all([apiKey.get(), apiKey.get()]);
    await apiKey.get();

    expect(mock.commandCalls(GetParameterCommand)).toHaveLength(1);
  });

  it('should read the parameter again after a failure', async () => {
    const { mock, apiKey } = createApiKey();
    mock
      .on(GetParameterCommand)
      .rejectsOnce(new Error('throttled'))
      .resolves({ Parameter: { Value: 'sk-test' } });

    await expect(apiKey.get()).rejects.toThrow('throttled');
    await expect(apiKey.get()).resolves.toBe('sk-test');
  });

  it('should fail when the parameter has no value', async () => {
    const { mock, apiKey } = createApiKey();
    mock.on(GetParameterCommand).resolves({ Parameter: {} });

    await expect(apiKey.get()).rejects.toThrow(
      'SSM parameter /nutrail-api/test/openai-api-key has no value.',
    );
  });
});
