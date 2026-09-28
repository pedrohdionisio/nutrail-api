import { z } from 'zod';

export const goalsSchema = z.union([
  z.strictObject({
    calories: z.int().positive(),
  }),
  z.strictObject({
    protein: z.int().nonnegative(),
    carbohydrate: z.int().nonnegative(),
    fat: z.int().nonnegative(),
  }),
]);

export type GoalsBody = z.infer<typeof goalsSchema>;
