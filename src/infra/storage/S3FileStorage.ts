import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type {
  FileStorage,
  UploadSignature,
} from '@/application/ports/FileStorage';
import { Injectable } from '@/kernel/decorators/Injectable';
import { AppConfig } from '@/shared/config/AppConfig';

const UPLOAD_EXPIRATION_SECONDS = 10 * 60;
const READ_EXPIRATION_SECONDS = 60 * 60;

@Injectable()
export class S3FileStorage implements FileStorage {
  constructor(
    private readonly client: S3Client,
    private readonly config: AppConfig,
  ) {}

  async createUpload({
    key,
    contentType,
    maxSizeBytes,
    metadata,
  }: {
    key: string;
    contentType: string;
    maxSizeBytes: number;
    metadata: Record<string, string>;
  }): Promise<UploadSignature> {
    const metadataFields = Object.fromEntries(
      Object.entries(metadata).map(([name, value]) => [
        `x-amz-meta-${name}`,
        value,
      ]),
    );

    const fields = { 'Content-Type': contentType, ...metadataFields };

    return createPresignedPost(this.client, {
      Bucket: this.config.bucketName,
      Key: key,
      Fields: fields,
      Conditions: [
        ['content-length-range', 1, maxSizeBytes],
        ...Object.entries(fields).map(
          ([name, value]) =>
            ['eq', `$${name}`, value] as ['eq', string, string],
        ),
      ],
      Expires: UPLOAD_EXPIRATION_SECONDS,
    });
  }

  getReadUrl(key: string): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.config.bucketName, Key: key }),
      { expiresIn: READ_EXPIRATION_SECONDS },
    );
  }

  async getMetadata(key: string): Promise<Record<string, string>> {
    const { Metadata } = await this.client.send(
      new HeadObjectCommand({ Bucket: this.config.bucketName, Key: key }),
    );

    return Metadata ?? {};
  }

  async deleteMany(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    await this.client.send(
      new DeleteObjectsCommand({
        Bucket: this.config.bucketName,
        Delete: { Objects: keys.map((key) => ({ Key: key })), Quiet: true },
      }),
    );
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    let cursor: string | undefined;

    do {
      const { Contents = [], NextContinuationToken } = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.config.bucketName,
          Prefix: prefix,
          ContinuationToken: cursor,
        }),
      );

      await this.deleteMany(Contents.flatMap(({ Key }) => (Key ? [Key] : [])));

      cursor = NextContinuationToken;
    } while (cursor);
  }
}
