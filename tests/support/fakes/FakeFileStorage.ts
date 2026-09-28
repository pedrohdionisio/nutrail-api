import type {
  FileStorage,
  UploadSignature,
} from '@/application/ports/FileStorage';

type Upload = {
  key: string;
  contentType: string;
  maxSizeBytes: number;
  metadata: Record<string, string>;
};

export const UPLOAD_URL = 'https://uploads.test/';

export function readUrlOf(key: string): string {
  return `https://files.test/${key}`;
}

export class FakeFileStorage implements FileStorage {
  readonly files = new Map<string, Record<string, string>>();
  readonly uploads: Upload[] = [];

  putFile(key: string, metadata: Record<string, string> = {}): void {
    this.files.set(key, metadata);
  }

  async createUpload(upload: Upload): Promise<UploadSignature> {
    this.uploads.push(upload);

    return {
      url: UPLOAD_URL,
      fields: { key: upload.key, 'Content-Type': upload.contentType },
    };
  }

  async getReadUrl(key: string): Promise<string> {
    return readUrlOf(key);
  }

  async getMetadata(key: string): Promise<Record<string, string>> {
    const metadata = this.files.get(key);

    if (!metadata) {
      throw new Error(`File ${key} does not exist.`);
    }

    return metadata;
  }

  async deleteMany(keys: string[]): Promise<void> {
    for (const key of keys) this.files.delete(key);
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    for (const key of this.files.keys()) {
      if (key.startsWith(prefix)) this.files.delete(key);
    }
  }
}
