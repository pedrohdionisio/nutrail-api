import { z } from 'zod';

export const saveMealSchema = z.object({
  mealId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(60),
});

export type SaveMealBody = z.infer<typeof saveMealSchema>;
