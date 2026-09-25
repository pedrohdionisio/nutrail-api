import { z } from 'zod';

export const createManualMealSchema = z.object({
  date: z.iso.date(),
  time: z.iso.time({ precision: -1 }),
  text: z.string().trim().min(1).max(1000),
});

export type CreateManualMealBody = z.infer<typeof createManualMealSchema>;
