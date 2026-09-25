import { z } from 'zod';

export const saveRecipeSchema = z.object({
  name: z.string().trim().min(1).max(120),
  ingredients: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(100),
        quantity: z.number().positive(),
        unit: z.string().trim().min(1).max(30),
      }),
    )
    .min(1)
    .max(50),
  instructions: z.string().trim().min(1).max(5000),
  calories: z.int().nonnegative(),
  protein: z.number().nonnegative(),
  carbohydrate: z.number().nonnegative(),
  fat: z.number().nonnegative(),
});

export type SaveRecipeBody = z.infer<typeof saveRecipeSchema>;
