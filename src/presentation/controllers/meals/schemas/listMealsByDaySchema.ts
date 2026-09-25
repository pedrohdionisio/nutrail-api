import { z } from 'zod';

export const listMealsByDaySchema = z.object({
  date: z.iso.date(),
});

export type ListMealsByDayParams = z.infer<typeof listMealsByDaySchema>;
