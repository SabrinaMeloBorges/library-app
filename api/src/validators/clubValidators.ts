import { z } from 'zod';
import { optionalTrimmedString } from './common';

const clubNameSchema = z
  .string({ required_error: 'Nome do clube é obrigatório' })
  .trim()
  .min(3, 'O nome deve ter pelo menos 3 caracteres')
  .max(80, 'O nome deve ter no máximo 80 caracteres');

const currentBookSchema = z.string().uuid('Livro inválido').nullable().optional();

export const createClubSchema = z
  .object({
    name: clubNameSchema,
    description: optionalTrimmedString('Descrição', 500),
    currentUserBookId: currentBookSchema,
  })
  .strict();

export const updateClubSchema = z
  .object({
    name: clubNameSchema.optional(),
    description: optionalTrimmedString('Descrição', 500),
    currentUserBookId: currentBookSchema,
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, 'Informe ao menos um campo para atualizar');

export const joinClubSchema = z
  .object({
    inviteCode: z
      .string({ required_error: 'Código de convite é obrigatório' })
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9]{8}$/, 'Código de convite inválido'),
  })
  .strict();

export const addMemberSchema = z
  .object({ userId: z.string({ required_error: 'Pessoa é obrigatória' }).uuid('Pessoa inválida') })
  .strict();

export const memberParamsSchema = z.object({
  id: z.string().uuid('Identificador inválido'),
  userId: z.string().uuid('Identificador inválido'),
});

export const clubGoalParamsSchema = z.object({
  id: z.string().uuid('Identificador inválido'),
  goalId: z.string().uuid('Identificador inválido'),
});

export type CreateClubInput = z.infer<typeof createClubSchema>;
export type UpdateClubInput = z.infer<typeof updateClubSchema>;
