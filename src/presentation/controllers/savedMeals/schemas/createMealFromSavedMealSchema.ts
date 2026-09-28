import { z } from 'zod';

export const createMealFromSavedMealSchema = z.object({
  date: z.iso.date(),
  time: z.iso.time({ precision: -1 }),
});

export type CreateMealFromSavedMealBody = z.infer<
  typeof createMealFromSavedMealSchema
>;
