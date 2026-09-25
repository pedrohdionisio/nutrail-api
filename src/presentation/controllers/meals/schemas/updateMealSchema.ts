import { z } from 'zod';

export const updateMealSchema = z.object({
  name: z.string().trim().min(1).max(120),
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(100),
        quantity: z.number().positive(),
        unit: z.string().trim().min(1).max(30),
        calories: z.int().nonnegative(),
        protein: z.number().nonnegative(),
        carbohydrate: z.number().nonnegative(),
        fat: z.number().nonnegative(),
      }),
    )
    .min(1)
    .max(50),
});

export type UpdateMealBody = z.infer<typeof updateMealSchema>;
