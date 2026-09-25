import { z } from 'zod';

export const confirmForgotPasswordSchema = z.object({
  email: z.email(),
  code: z.string().min(1),
  password: z.string().min(8),
});

export type ConfirmForgotPasswordBody = z.infer<
  typeof confirmForgotPasswordSchema
>;
