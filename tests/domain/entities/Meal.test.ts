import { describe, expect, it } from 'vitest';
import { SavedMeal } from '@/domain/entities/SavedMeal';
import { InvalidMealTransitionError } from '@/domain/errors/InvalidMealTransitionError';
import { MealNotEditableError } from '@/domain/errors/MealNotEditableError';
import { MealNotSavableError } from '@/domain/errors/MealNotSavableError';
import { MealWithoutItemsError } from '@/domain/errors/MealWithoutItemsError';
import {
  buildMeal,
  buildMealAnalysis,
  buildMealItem,
  buildPendingMeal,
} from '../../support/fixtures/meal';

describe('Meal', () => {
  describe('processing lifecycle', () => {
    it('should go from uploading to queued to processing to success', () => {
      const meal = buildPendingMeal();

      meal.markAsQueued();
      expect(meal.status).toBe('QUEUED');

      meal.markAsProcessing();
      expect(meal.status).toBe('PROCESSING');
      expect(meal.attempts).toBe(1);

      meal.complete(buildMealAnalysis());
      expect(meal.status).toBe('SUCCESS');
      expect(meal.name).toBe('Almoço');
      expect(meal.items).toHaveLength(2);
      expect(meal.isFinished).toBe(true);
    });

    it('should count one attempt per processing and go back to the queue on requeue', () => {
      const meal = buildPendingMeal({ status: 'QUEUED' });

      meal.markAsProcessing();
      meal.requeue();
      meal.markAsProcessing();

      expect(meal.status).toBe('PROCESSING');
      expect(meal.attempts).toBe(2);
    });

    it('should fail from queued or processing', () => {
      const queued = buildPendingMeal({ status: 'QUEUED' });
      const processing = buildPendingMeal({ status: 'PROCESSING' });

      queued.fail();
      processing.fail();

      expect(queued.status).toBe('FAILED');
      expect(processing.status).toBe('FAILED');
      expect(processing.isFinished).toBe(true);
    });

    it.each([
      ['markAsQueued', 'QUEUED'],
      ['markAsProcessing', 'UPLOADING'],
      ['requeue', 'UPLOADING'],
      ['fail', 'SUCCESS'],
    ] as const)(
      'should refuse %s from an invalid status',
      (transition, status) => {
        const meal = buildPendingMeal({
          status: status === 'QUEUED' ? 'SUCCESS' : status,
        });

        expect(() => meal[transition]()).toThrow(InvalidMealTransitionError);
      },
    );

    it('should refuse completing a meal that is not processing', () => {
      expect(() =>
        buildPendingMeal({ status: 'QUEUED' }).complete(buildMealAnalysis()),
      ).toThrow(InvalidMealTransitionError);
    });

    it('should refuse completing without items', () => {
      const meal = buildPendingMeal({ status: 'PROCESSING' });

      expect(() => meal.complete(buildMealAnalysis({ items: [] }))).toThrow(
        MealWithoutItemsError,
      );
      expect(meal.status).toBe('PROCESSING');
    });
  });

  describe('retry', () => {
    it('should queue a failed meal again and reset the attempts', () => {
      const meal = buildPendingMeal({ status: 'FAILED', attempts: 3 });

      meal.retry();

      expect(meal.status).toBe('QUEUED');
      expect(meal.attempts).toBe(0);
    });

    it('should refuse retrying a meal that did not fail', () => {
      expect(() => buildPendingMeal({ status: 'SUCCESS' }).retry()).toThrow(
        InvalidMealTransitionError,
      );
    });

    it('should refuse retrying a manual meal', () => {
      expect(() =>
        buildMeal({ status: 'FAILED', inputType: 'MANUAL' }).retry(),
      ).toThrow(InvalidMealTransitionError);
    });
  });

  describe('transcription', () => {
    it('should record the transcription while processing', () => {
      const meal = buildPendingMeal({
        status: 'PROCESSING',
        inputType: 'AUDIO',
      });

      meal.recordTranscription('Comi arroz e frango');

      expect(meal.inputText).toBe('Comi arroz e frango');
    });

    it('should refuse a transcription outside processing', () => {
      expect(() =>
        buildPendingMeal({ status: 'QUEUED' }).recordTranscription('texto'),
      ).toThrow(InvalidMealTransitionError);
    });
  });

  describe('attachPicture', () => {
    it.each(['SUCCESS', 'FAILED'] as const)(
      'should attach a picture to a %s meal',
      (status) => {
        const meal = buildMeal({ status });

        meal.attachPicture('pictures/user-1/meal-1.jpg');

        expect(meal.pictureKey).toBe('pictures/user-1/meal-1.jpg');
      },
    );

    it('should refuse a picture while the meal is not finished', () => {
      expect(() =>
        buildPendingMeal({ status: 'PROCESSING' }).attachPicture('key'),
      ).toThrow(InvalidMealTransitionError);
    });
  });

  describe('edit', () => {
    it('should replace the name, items, date and time of an analyzed meal', () => {
      const meal = buildMeal();
      const items = [buildMealItem({ name: 'Salada', calories: 50 })];

      meal.edit({ name: 'Jantar', items, date: '2026-09-25', time: '20:00' });

      expect(meal.name).toBe('Jantar');
      expect(meal.items).toEqual(items);
      expect(meal.date).toBe('2026-09-25');
      expect(meal.time).toBe('20:00');
    });

    it('should refuse editing a meal that is not analyzed', () => {
      expect(() =>
        buildPendingMeal({ status: 'FAILED' }).edit({
          name: 'Jantar',
          items: [buildMealItem()],
          date: '2026-09-26',
          time: '20:00',
        }),
      ).toThrow(MealNotEditableError);
    });

    it('should refuse removing every item', () => {
      expect(() =>
        buildMeal().edit({
          name: 'Jantar',
          items: [],
          date: '2026-09-26',
          time: '20:00',
        }),
      ).toThrow(MealWithoutItemsError);
    });
  });

  describe('totals', () => {
    it('should derive the totals from the items', () => {
      expect(buildMeal().totals).toEqual({
        calories: 403,
        protein: 49.6,
        carbohydrate: 34,
        fat: 5.7,
      });
    });
  });

  describe('saveAs', () => {
    it('should create a saved meal with a copy of the items', () => {
      const meal = buildMeal();

      const savedMeal = meal.saveAs({
        id: 'saved-9',
        name: 'Almoço de sempre',
        createdAt: '2026-09-26T16:00:00.000Z',
      });

      expect(savedMeal).toBeInstanceOf(SavedMeal);
      expect(savedMeal).toMatchObject({
        id: 'saved-9',
        userId: 'user-1',
        name: 'Almoço de sempre',
        createdAt: '2026-09-26T16:00:00.000Z',
      });
      expect(savedMeal.items).toEqual(meal.items);
      expect(savedMeal.items[0]).not.toBe(meal.items[0]);
    });

    it('should refuse saving a meal that is not analyzed', () => {
      expect(() =>
        buildPendingMeal({ status: 'FAILED' }).saveAs({
          id: 's',
          name: 'x',
          createdAt: 'c',
        }),
      ).toThrow(MealNotSavableError);
    });
  });
});
