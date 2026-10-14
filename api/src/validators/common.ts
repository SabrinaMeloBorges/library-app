import { z } from 'zod';

export const idParamSchema = z.object({ id: z.string().uuid('Identificador inválido') });

export const trimmedString = (label: string, max: number) =>
  z
    .string({ required_error: `${label} é obrigatório`, invalid_type_error: `${label} inválido` })
    .trim()
    .min(1, `${label} é obrigatório`)
    .max(max, `${label} deve ter no máximo ${max} caracteres`);

export const optionalTrimmedString = (label: string, max: number) =>
  z
    .string({ invalid_type_error: `${label} inválido` })
    .trim()
    .max(max, `${label} deve ter no máximo ${max} caracteres`)
    .transform((value) => (value.length > 0 ? value : null))
    .nullable()
    .optional();

export const pageNumber = (label: string, min = 0) =>
  z
    .number({
      required_error: `${label} é obrigatório`,
      invalid_type_error: `${label} deve ser um número`,
    })
    .int(`${label} deve ser um número inteiro`)
    .min(min, `${label} deve ser maior ou igual a ${min}`)
    .max(100000, `${label} deve ser no máximo 100000`);

export const usernameSchema = z
  .string({ invalid_type_error: 'Nome de usuário inválido' })
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9_.]{3,30}$/,
    'Use de 3 a 30 caracteres: letras minúsculas, números, ponto ou sublinhado',
  );

export const optionalIsoDate = (label: string) =>
  z
    .string()
    .datetime({ offset: true, message: `${label} inválida` })
    .transform((value) => new Date(value))
    .optional();

export const pageLimit = (max: number, fallback: number) =>
  z.coerce.number().int().min(1).max(max).default(fallback);

export const dateOnlyString = (label: string) =>
  z
    .string({ required_error: `${label} é obrigatória` })
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} deve estar no formato AAAA-MM-DD`)
    .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), `${label} inválida`);
