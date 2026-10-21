import { z } from 'zod';
import { profileSchema } from '@/presentation/controllers/profile/schemas/profileSchema';

export const signUpSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{4,32}$/),
  account: z.object({
    email: z.email(),
    password: z.string().min(8),
  }),
  profile: profileSchema,
});

export type SignUpBody = z.infer<typeof signUpSchema>;
