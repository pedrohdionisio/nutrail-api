import { readdir, readFile } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { setTimeout } from 'node:timers/promises';

const FILE_TYPES: Record<
  string,
  { inputType: 'PICTURE' | 'AUDIO'; contentType: string }
> = {
  '.jpg': { inputType: 'PICTURE', contentType: 'image/jpeg' },
  '.jpeg': { inputType: 'PICTURE', contentType: 'image/jpeg' },
  '.m4a': { inputType: 'AUDIO', contentType: 'audio/m4a' },
};

const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS = 12 * 60 * 1_000;

const baseUrl = required('BASE_URL').replace(/\/$/, '');
const email = required('TEST_USER_EMAIL');
const password = required('TEST_USER_PASSWORD');

const filePath = process.argv[2] ?? (await findScriptFile());
const fileType = FILE_TYPES[extname(filePath).toLowerCase()];

if (!fileType) {
  fail(`Unsupported file ${filePath}. Use .jpg, .jpeg or .m4a.`);
}

const { accessToken } = await api<{ accessToken: string }>(
  'POST',
  '/auth/sign-in',
  { email, password },
);

const now = new Date();

const { mealId, upload } = await api<{
  mealId: string;
  upload: { url: string; fields: Record<string, string> };
}>(
  'POST',
  '/meals',
  { date: localDate(now), time: localTime(now), inputType: fileType.inputType },
  accessToken,
);

console.log(`Meal ${mealId} created (${fileType.inputType}).`);

const form = new FormData();

for (const [name, value] of Object.entries(upload.fields)) {
  form.append(name, value);
}

form.append(
  'file',
  new Blob([await readFile(filePath)], { type: fileType.contentType }),
  basename(filePath),
);

const uploadResponse = await fetch(upload.url, { method: 'POST', body: form });

if (!uploadResponse.ok) {
  fail(
    `Upload failed (${uploadResponse.status}): ${await uploadResponse.text()}`,
  );
}

console.log(`Uploaded ${basename(filePath)}. Waiting for processing...`);

const deadline = Date.now() + POLL_TIMEOUT_MS;
let lastStatus = '';

while (Date.now() < deadline) {
  const meal = await api<{ status: string }>(
    'GET',
    `/meals/${mealId}`,
    undefined,
    accessToken,
  );

  if (meal.status !== lastStatus) {
    console.log(`Status: ${meal.status}`);
    lastStatus = meal.status;
  }

  if (meal.status === 'SUCCESS' || meal.status === 'FAILED') {
    console.log(JSON.stringify(meal, null, 2));
    process.exit(meal.status === 'SUCCESS' ? 0 : 1);
  }

  await setTimeout(POLL_INTERVAL_MS);
}

fail(`Meal ${mealId} did not finish in ${POLL_TIMEOUT_MS / 60_000} minutes.`);

async function api<T>(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();

  if (!response.ok) {
    fail(`${method} ${path} failed (${response.status}): ${text}`);
  }

  return JSON.parse(text) as T;
}

async function findScriptFile(): Promise<string> {
  const scriptsDir = import.meta.dirname;
  const files = await readdir(scriptsDir);
  const media = files.find((file) => extname(file).toLowerCase() in FILE_TYPES);

  if (!media) {
    fail('No .jpg, .jpeg or .m4a file found in scripts/.');
  }

  return join(scriptsDir, media);
}

function localDate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function localTime(date: Date): string {
  return [
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
  ].join(':');
}

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    fail(`Missing ${name} in .env.`);
  }

  return value;
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}
