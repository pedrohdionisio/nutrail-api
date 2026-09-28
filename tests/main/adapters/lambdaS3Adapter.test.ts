import { describe, expect, it, vi } from 'vitest';
import { MealUploadedUseCase } from '@/application/usecases/meals/MealUploadedUseCase';
import { lambdaS3Adapter } from '@/main/adapters/lambdaS3Adapter';
import { container } from '@/main/container';
import { MealFileUploadedHandler } from '@/presentation/file-events/MealFileUploadedHandler';
import { s3Event } from '../../support/app';

describe('lambdaS3Adapter', () => {
  it('should pass the key of the created object to the handler', async () => {
    const execute = vi
      .spyOn(container.resolve(MealUploadedUseCase), 'execute')
      .mockResolvedValue();

    await lambdaS3Adapter(MealFileUploadedHandler)(
      s3Event('pictures/user-1/meal-1.jpg'),
    );

    expect(execute).toHaveBeenCalledWith('pictures/user-1/meal-1.jpg');
  });
});
