import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import { Injectable } from '@/kernel/decorators/Injectable';
import { AppConfig } from '@/shared/config/AppConfig';

@Injectable()
export class SsmOpenAIApiKey {
  private value: Promise<string> | null = null;

  constructor(
    private readonly client: SSMClient,
    private readonly config: AppConfig,
  ) {}

  get(): Promise<string> {
    if (!this.value) {
      this.value = this.load().catch((error: unknown) => {
        this.value = null;
        throw error;
      });
    }

    return this.value;
  }

  private async load(): Promise<string> {
    const { Parameter } = await this.client.send(
      new GetParameterCommand({
        Name: this.config.openai.apiKeyParameter,
        WithDecryption: true,
      }),
    );

    if (!Parameter?.Value) {
      throw new Error(
        `SSM parameter ${this.config.openai.apiKeyParameter} has no value.`,
      );
    }

    return Parameter.Value;
  }
}
