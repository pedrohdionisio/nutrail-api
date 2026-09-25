import { z } from 'zod';

export const analyzeMealItemsSchema = z.object({
  text: z.string().trim().min(1).max(500),
});

export type AnalyzeMealItemsBody = z.infer<typeof analyzeMealItemsSchema>;
