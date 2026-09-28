import { z } from 'zod';

export const createMealFromRecipeSchema = z.object({
  date: z.iso.date(),
  time: z.iso.time({ precision: -1 }),
});

export type CreateMealFromRecipeBody = z.infer<
  typeof createMealFromRecipeSchema
>;
