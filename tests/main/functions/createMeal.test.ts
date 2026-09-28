import { describe, expect, it } from 'vitest';
import { handler } from '@/main/functions/createMeal';
import {
  fakes,
  givenSignedInUser,
  invoke,
  validationErrorBody,
} from '../../support/app';
import { UPLOAD_URL } from '../../support/fakes/FakeFileStorage';

describe('POST /meals', () => {
  it('should create the meal and return the upload signature of its input file', async () => {
    const user = givenSignedInUser();

    const response = await invoke(handler, {
      as: user,
      body: { date: '2026-09-26', time: '12:30', inputType: 'AUDIO' },
    });

    expect(response).toEqual({
      statusCode: 201,
      body: {
        mealId: 'id-1',
        upload: {
          url: UPLOAD_URL,
          fields: {
            key: 'inputs/user-1/id-1.m4a',
            'Content-Type': 'audio/m4a',
          },
        },
      },
    });
    expect(fakes().db.meals.get('id-1')?.status).toBe('UPLOADING');
  });

  it('should accept only picture and audio inputs with a valid date and time', async () => {
    const user = givenSignedInUser();

    expect(
      await invoke(handler, {
        as: user,
        body: { date: '26/09/2026', time: '25:00', inputType: 'MANUAL' },
      }),
    ).toEqual({
      statusCode: 400,
      body: validationErrorBody('date', 'time', 'inputType'),
    });
  });
});
