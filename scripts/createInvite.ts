import { spawnSync } from 'node:child_process';
import { randomInt } from 'node:crypto';
import { parseArgs } from 'node:util';
import {
  CloudFormationClient,
  DescribeStackResourceCommand,
} from '@aws-sdk/client-cloudformation';
import {
  ConditionalCheckFailedException,
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const REGION = 'us-east-1';
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';
const CODE_PATTERN = /^[A-Z0-9-]{4,32}$/;

const { values } = parseArgs({
  options: {
    stage: { type: 'string', default: 'dev' },
    uses: { type: 'string', default: '1' },
    code: { type: 'string' },
  },
});

const maxUses = Number(values.uses);

if (!Number.isInteger(maxUses) || maxUses < 1) {
  fail(`--uses must be a positive integer, got ${values.uses}.`);
}

const code = values.code?.trim().toUpperCase() ?? randomCode();

if (!CODE_PATTERN.test(code)) {
  fail(`--code must have 4 to 32 letters, digits or dashes, got ${code}.`);
}

try {
  const tableName = await findTableName(values.stage);
  const client = DynamoDBDocumentClient.from(
    new DynamoDBClient({ region: REGION }),
  );

  await client.send(
    new PutCommand({
      TableName: tableName,
      Item: {
        PK: `INVITE#${code}`,
        SK: 'INVITE',
        code,
        maxUses,
        uses: 0,
        createdAt: new Date().toISOString(),
      },
      ConditionExpression: 'attribute_not_exists(PK)',
    }),
  );
} catch (error) {
  if (error instanceof ConditionalCheckFailedException) {
    fail(`The invite ${code} already exists on ${values.stage}.`);
  }

  if (isExpiredSession(error)) {
    fail('No valid AWS session. Run `aws sso login` and try again.');
  }

  if (isMissingStack(error)) {
    fail(`The stage ${values.stage} is not deployed.`);
  }

  throw error;
}

console.log(`
  Invite code: ${code}

  Stage ${values.stage}, ${maxUses} sign-up${maxUses === 1 ? '' : 's'}.${copyToClipboard(code) ? ' Copied to the clipboard.' : ''}
`);

async function findTableName(stage: string): Promise<string> {
  const { StackResourceDetail } = await new CloudFormationClient({
    region: REGION,
  }).send(
    new DescribeStackResourceCommand({
      StackName: `nutrail-api-${stage}`,
      LogicalResourceId: 'MainTable',
    }),
  );

  if (!StackResourceDetail?.PhysicalResourceId) {
    fail(`The stage ${stage} has no table. Deploy it first.`);
  }

  return StackResourceDetail.PhysicalResourceId;
}

function isExpiredSession(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'CredentialsProviderError' ||
      error.name === 'ExpiredTokenException' ||
      /token (has )?expired|sso/i.test(error.message))
  );
}

function isMissingStack(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.name === 'ValidationError' &&
    /does not exist/.test(error.message)
  );
}

function copyToClipboard(text: string): boolean {
  if (process.platform !== 'darwin') {
    return false;
  }

  return spawnSync('pbcopy', { input: text }).status === 0;
}

function randomCode(): string {
  const chars = Array.from(
    { length: 8 },
    () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)],
  ).join('');

  return `${chars.slice(0, 4)}-${chars.slice(4)}`;
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}
