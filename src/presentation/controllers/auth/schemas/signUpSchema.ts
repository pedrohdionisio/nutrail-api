import { z } from 'zod';
import { ACTIVITY_LEVELS, GENDERS, GOALS } from '@/domain/entities/User';

export const signUpSchema = z.object({
  account: z.object({
    email: z.email(),
    password: z.string().min(8),
  }),
  profile: z.object({
    name: z.string().trim().min(1),
    gender: z.enum(GENDERS),
    birthDate: z.iso
      .date()
      .refine((date) => date <= new Date().toISOString().slice(0, 10), {
        message: 'Birth date cannot be in the future.',
      }),
    height: z.number().positive(),
    weight: z.number().positive(),
    goal: z.enum(GOALS),
    activityLevel: z.enum(ACTIVITY_LEVELS),
  }),
});

export type SignUpBody = z.infer<typeof signUpSchema>;
