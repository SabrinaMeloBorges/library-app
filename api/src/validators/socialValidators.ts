import { z } from 'zod';
import {
  optionalIsoDate,
  optionalTrimmedString,
  pageLimit,
  trimmedString,
  usernameSchema,
} from './common';

export const updateProfileSchema = z
  .object({
    name: trimmedString('Nome', 80).optional(),
    username: usernameSchema.optional(),
    bio: optionalTrimmedString('Bio', 160),
    shareActivity: z.boolean({ invalid_type_error: 'Preferência inválida' }).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, 'Informe ao menos um campo para atualizar');

export const userSearchSchema = z.object({
  q: z
    .string({ required_error: 'Informe o termo de busca' })
    .trim()
    .min(2, 'Digite pelo menos 2 caracteres')
    .max(50, 'Busca muito longa'),
});

export const feedQuerySchema = z.object({
  before: optionalIsoDate('Data de referência'),
  limit: pageLimit(50, 20),
});

export const commentSchema = z.object({ body: trimmedString('Comentário', 500) }).strict();

export const commentParamsSchema = z.object({
  id: z.string().uuid('Identificador inválido'),
  commentId: z.string().uuid('Identificador inválido'),
});

export const markSeenSchema = z
  .object({
    codes: z
      .array(z.string().trim().min(1).max(40), {
        invalid_type_error: 'Lista de conquistas inválida',
      })
      .min(1, 'Informe ao menos uma conquista')
      .max(50, 'Muitas conquistas de uma vez'),
  })
  .strict();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type FeedQuery = z.infer<typeof feedQuerySchema>;
