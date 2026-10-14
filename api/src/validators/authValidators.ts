import { z } from 'zod';
import { trimmedString } from './common';

const emailSchema = z
  .string({ required_error: 'E-mail é obrigatório' })
  .trim()
  .toLowerCase()
  .max(160, 'E-mail muito longo')
  .email('E-mail inválido');

export const registerSchema = z.object({
  name: trimmedString('Nome', 80),
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

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
