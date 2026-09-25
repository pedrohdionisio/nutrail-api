import { z } from 'zod';

export const goalsSchema = z.object({
  calories: z.int().positive(),
  protein: z.int().nonnegative(),
  carbohydrate: z.int().nonnegative(),
  fat: z.int().nonnegative(),
});

export type GoalsBody = z.infer<typeof goalsSchema>;
