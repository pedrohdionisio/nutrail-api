import { Clock } from '@/application/ports/Clock';
import {
  FileStorage,
  type UploadSignature,
} from '@/application/ports/FileStorage';
import { IdGenerator } from '@/application/ports/IdGenerator';
import { MealRepository } from '@/application/ports/MealRepository';
import {
  MAX_MEAL_FILE_SIZE_BYTES,
  MEAL_FILES,
  type MealFileType,
  mealFileKey,
} from '@/application/services/mealFiles';
import { Meal } from '@/domain/entities/Meal';
import type { Language } from '@/domain/value-objects/Language';
import { Injectable } from '@/kernel/decorators/Injectable';

type Input = {
  userId: string;
  date: string;
  time: string;
  inputType: MealFileType;
  language: Language;
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

  async execute({
    userId,
    date,
    time,
    inputType,
    language,
  }: Input): Promise<Output> {
    const mealId = this.ids.generate();
    const fileKey = mealFileKey(inputType, userId, mealId);

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
        language,
        createdAt: this.clock.now().toISOString(),
      }),
    );

    const upload = await this.storage.createUpload({
      key: fileKey,
      contentType: MEAL_FILES[inputType].contentType,
      maxSizeBytes: MAX_MEAL_FILE_SIZE_BYTES,
      metadata: { userid: userId, mealid: mealId },
    });

    return { mealId, upload };
  }
}
