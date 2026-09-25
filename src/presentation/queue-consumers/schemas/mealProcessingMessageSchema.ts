import { z } from 'zod';

export const mealProcessingMessageSchema = z.object({
  userId: z.string().min(1),
  mealId: z.string().min(1),
});
