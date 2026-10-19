import { z } from 'zod';
import { trimmedString, usernameSchema } from './common';

const emailSchema = z
  .string({ required_error: 'E-mail é obrigatório' })
  .trim()
  .toLowerCase()
  .max(160, 'E-mail muito longo')
  .email('E-mail inválido');

export const registerSchema = z.object({
  name: trimmedString('Nome', 80),
  username: usernameSchema.optional(),
  email: emailSchema,
  password: z
    .string({ required_error: 'Senha é obrigatória' })
    .min(8, 'A senha deve ter pelo menos 8 caracteres')
    .max(72, 'A senha deve ter no máximo 72 caracteres')
    .regex(/[A-Za-z]/, 'A senha deve conter pelo menos uma letra')
    .regex(/\d/, 'A senha deve conter pelo menos um número'),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string({ required_error: 'Senha é obrigatória' })
    .min(1, 'Senha é obrigatória')
    .max(72),
});

export const googleLoginSchema = z.object({
  idToken: z
    .string({ required_error: 'Token do Google é obrigatório' })
    .min(1, 'Token do Google é obrigatório')
    .max(4096),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;
