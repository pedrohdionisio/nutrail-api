import { z } from 'zod';

export const suggestRecipeSchema = z.object({
  date: z.iso.date(),
  text: z.string().trim().min(1).max(1000),
});

export type SuggestRecipeBody = z.infer<typeof suggestRecipeSchema>;
