import { describe, expect, it } from 'vitest';
import { handler } from '@/main/functions/listMealsByDay';
import {
  fakes,
  givenSignedInUser,
  invoke,
  validationErrorBody,
} from '../../support/app';
import { readUrlOf } from '../../support/fakes/FakeFileStorage';
import {
  buildMeal,
  buildMealItem,
  buildPendingMeal,
} from '../../support/fixtures/meal';

describe('GET /meals?date=', () => {
  it('should list the meals of the day by time, with picture urls and totals of analyzed meals', async () => {
    const user = givenSignedInUser();
    const { db } = fakes();
    db.putMeal(
      buildMeal({
        id: 'lunch',
        time: '12:30',
        pictureKey: 'pictures/user-1/lunch.jpg',
        items: [
          buildMealItem({
            calories: 500,
            protein: 30,
            carbohydrate: 60,
            fat: 15,
          }),
        ],
      }),
    );
    db.putMeal(
      buildMeal({
        id: 'breakfast',
        name: 'Café da manhã',
        time: '08:00',
        items: [
          buildMealItem({
            calories: 300,
            protein: 10.5,
            carbohydrate: 40,
            fat: 8,
          }),
        ],
      }),
    );
    db.putMeal(
      buildPendingMeal({ id: 'snack', time: '16:00', status: 'PROCESSING' }),
    );
    db.putMeal(buildPendingMeal({ id: 'uploading', time: '17:00' }));
    db.putMeal(buildMeal({ id: 'yesterday', date: '2026-09-25' }));
    db.putMeal(buildMeal({ id: 'other-user', userId: 'user-2' }));

    const response = await invoke(handler, {
      as: user,
      query: { date: '2026-09-26' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      date: '2026-09-26',
      meals: [
        { id: 'breakfast', time: '08:00', pictureUrl: null, calories: 300 },
        {
          id: 'lunch',
          time: '12:30',
          pictureUrl: readUrlOf('pictures/user-1/lunch.jpg'),
          calories: 500,
        },
        { id: 'snack', status: 'PROCESSING', name: null },
      ],
      totals: { calories: 800, protein: 40.5, carbohydrate: 100, fat: 23 },
    });
  });

  it('should return an empty day', async () => {
    const user = givenSignedInUser();

    expect(
      await invoke(handler, { as: user, query: { date: '2026-09-26' } }),
    ).toEqual({
      statusCode: 200,
      body: {
        date: '2026-09-26',
        meals: [],
        totals: { calories: 0, protein: 0, carbohydrate: 0, fat: 0 },
      },
    });
  });

  it('should require a valid date', async () => {
    const user = givenSignedInUser();

    expect(await invoke(handler, { as: user })).toEqual({
      statusCode: 400,
      body: validationErrorBody('date'),
    });
  });
});
