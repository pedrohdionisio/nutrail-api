import { z } from 'zod';

export const createMealSchema = z.object({
  date: z.iso.date(),
  time: z.iso.time({ precision: -1 }),
  inputType: z.enum(['PICTURE', 'AUDIO']),
});

export type CreateMealBody = z.infer<typeof createMealSchema>;
