export class AppConfig {
  readonly tableName = required('TABLE_NAME');
  readonly cognito = {
    userPoolId: required('COGNITO_USER_POOL_ID'),
    clientId: required('COGNITO_CLIENT_ID'),
  };
  readonly email = {
    from: required('EMAIL_FROM'),
  };
  readonly openai = {
    apiKey: required('OPENAI_API_KEY'),
  };
}

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable ${name}.`);
  }

  return value;
}
