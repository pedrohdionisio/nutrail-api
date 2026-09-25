import { Clock } from '@/application/ports/Clock';
import {
  FileStorage,
  type UploadSignature,
} from '@/application/ports/FileStorage';
import { IdGenerator } from '@/application/ports/IdGenerator';
import { MealRepository } from '@/application/ports/MealRepository';
import { Meal } from '@/domain/entities/Meal';
import { Injectable } from '@/kernel/decorators/Injectable';

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

const UPLOADS = {
  PICTURE: { folder: 'pictures', extension: 'jpg', contentType: 'image/jpeg' },
  AUDIO: { folder: 'inputs', extension: 'm4a', contentType: 'audio/m4a' },
};

type Input = {
  userId: string;
  date: string;
  time: string;
  inputType: keyof typeof UPLOADS;
};

type Output = {
  mealId: string;
  upload: UploadSignature;
};

@Injectable()
export class CreateMealUseCase {
  constructor(
    private readonly meals: MealRepository,
    private readonly storage: FileStorage,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute({ userId, date, time, inputType }: Input): Promise<Output> {
    const { folder, extension, contentType } = UPLOADS[inputType];
    const mealId = this.ids.generate();
    const fileKey = `${folder}/${userId}/${mealId}.${extension}`;

    await this.meals.create(
      new Meal({
        id: mealId,
        userId,
        status: 'UPLOADING',
        inputType,
        inputFileKey: fileKey,
        inputText: null,
        pictureKey: inputType === 'PICTURE' ? fileKey : null,
        name: null,
        items: [],
        attempts: 0,
        date,
        time,
        createdAt: this.clock.now().toISOString(),
      }),
    );

    const upload = await this.storage.createUpload({
      key: fileKey,
      contentType,
      maxSizeBytes: MAX_UPLOAD_SIZE_BYTES,
      metadata: { userid: userId, mealid: mealId },
    });

    return { mealId, upload };
  }
}
