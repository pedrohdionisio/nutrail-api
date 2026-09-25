export type UploadSignature = {
  url: string;
  fields: Record<string, string>;
};

export abstract class FileStorage {
  abstract createUpload(input: {
    key: string;
    contentType: string;
    maxSizeBytes: number;
    metadata: Record<string, string>;
  }): Promise<UploadSignature>;

  abstract getReadUrl(key: string): Promise<string>;

  abstract getMetadata(key: string): Promise<Record<string, string>>;

  abstract deleteMany(keys: string[]): Promise<void>;
}
