import {
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import { describe, expect, it } from 'vitest';
import { S3FileStorage } from '@/infra/storage/S3FileStorage';
import { AppConfig } from '@/shared/config/AppConfig';

const BUCKET = 'nutrail-files-test';

function setup() {
  const client = new S3Client({ region: 'us-east-1' });

  return { client, storage: new S3FileStorage(client, new AppConfig()) };
}

describe('S3FileStorage', () => {
  it('should sign a POST upload that enforces the type, the size and the metadata', async () => {
    const { storage } = setup();

    const { url, fields } = await storage.createUpload({
      key: 'pictures/user-1/meal-1.jpg',
      contentType: 'image/jpeg',
      maxSizeBytes: 1024,
      metadata: { userid: 'user-1', mealid: 'meal-1' },
    });

    expect(url).toContain(BUCKET);
    expect(fields).toMatchObject({
      key: 'pictures/user-1/meal-1.jpg',
      'Content-Type': 'image/jpeg',
      'x-amz-meta-userid': 'user-1',
      'x-amz-meta-mealid': 'meal-1',
    });

    const policy = JSON.parse(
      Buffer.from(fields.Policy ?? '', 'base64').toString('utf-8'),
    );
    expect(policy.conditions).toEqual(
      expect.arrayContaining([
        ['content-length-range', 1, 1024],
        ['eq', '$Content-Type', 'image/jpeg'],
        ['eq', '$x-amz-meta-userid', 'user-1'],
        ['eq', '$x-amz-meta-mealid', 'meal-1'],
      ]),
    );
    const expiresInMinutes =
      (Date.parse(policy.expiration) - Date.now()) / 60_000;
    expect(expiresInMinutes).toBeGreaterThan(9);
    expect(expiresInMinutes).toBeLessThanOrEqual(10);
  });

  it('should sign a read url valid for one hour', async () => {
    const { storage } = setup();

    const url = new URL(await storage.getReadUrl('pictures/user-1/meal-1.jpg'));

    expect(url.hostname).toContain(BUCKET);
    expect(url.pathname).toBe('/pictures/user-1/meal-1.jpg');
    expect(url.searchParams.get('X-Amz-Expires')).toBe('3600');
  });

  it('should read the object metadata', async () => {
    const { client, storage } = setup();
    const mock = mockClient(client);
    mock.on(HeadObjectCommand).resolves({ Metadata: { userid: 'user-1' } });

    expect(await storage.getMetadata('pictures/user-1/meal-1.jpg')).toEqual({
      userid: 'user-1',
    });
    expect(mock.commandCalls(HeadObjectCommand)[0]?.args[0].input).toEqual({
      Bucket: BUCKET,
      Key: 'pictures/user-1/meal-1.jpg',
    });
  });

  it('should return empty metadata when the object has none', async () => {
    const { client, storage } = setup();
    mockClient(client).on(HeadObjectCommand).resolves({});

    expect(await storage.getMetadata('key')).toEqual({});
  });

  it('should delete several objects at once and skip empty lists', async () => {
    const { client, storage } = setup();
    const mock = mockClient(client);
    mock.on(DeleteObjectsCommand).resolves({});

    await storage.deleteMany([]);
    await storage.deleteMany(['a.jpg', 'b.m4a']);

    expect(mock.commandCalls(DeleteObjectsCommand)).toHaveLength(1);
    expect(mock.commandCalls(DeleteObjectsCommand)[0]?.args[0].input).toEqual({
      Bucket: BUCKET,
      Delete: { Objects: [{ Key: 'a.jpg' }, { Key: 'b.m4a' }], Quiet: true },
    });
  });

  it('should delete every page of objects under a prefix', async () => {
    const { client, storage } = setup();
    const mock = mockClient(client);
    mock
      .on(ListObjectsV2Command)
      .resolvesOnce({
        Contents: [{ Key: 'pictures/user-1/a.jpg' }],
        NextContinuationToken: 'next',
      })
      .resolvesOnce({ Contents: [{ Key: 'pictures/user-1/b.jpg' }, {}] });
    mock.on(DeleteObjectsCommand).resolves({});

    await storage.deleteByPrefix('pictures/user-1/');

    expect(
      mock.commandCalls(ListObjectsV2Command).map(({ args }) => args[0].input),
    ).toEqual([
      {
        Bucket: BUCKET,
        Prefix: 'pictures/user-1/',
        ContinuationToken: undefined,
      },
      { Bucket: BUCKET, Prefix: 'pictures/user-1/', ContinuationToken: 'next' },
    ]);
    expect(
      mock
        .commandCalls(DeleteObjectsCommand)
        .map(({ args }) => args[0].input.Delete?.Objects),
    ).toEqual([
      [{ Key: 'pictures/user-1/a.jpg' }],
      [{ Key: 'pictures/user-1/b.jpg' }],
    ]);
  });
});
