import { z } from 'zod';

export const forgotPasswordSchema = z.object({
  email: z.email(),
});

export type ForgotPasswordBody = z.infer<typeof forgotPasswordSchema>;
