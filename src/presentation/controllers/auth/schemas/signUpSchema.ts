import { z } from 'zod';
import { profileSchema } from '@/presentation/controllers/profile/schemas/profileSchema';

export const signUpSchema = z.object({
  account: z.object({
    email: z.email(),
    password: z.string().min(8),
  }),
  profile: profileSchema,
});

export type SignUpBody = z.infer<typeof signUpSchema>;
