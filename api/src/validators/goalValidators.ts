import { z } from 'zod';
import { GOAL_PERIODS, GOAL_TYPES } from '../domain/entities';
import { dateOnlyString, trimmedString } from './common';

const MAX_GOAL_DAYS = 366 * 2;
const DAY_MS = 24 * 60 * 60 * 1000;

const goalTypeSchema = z.enum(GOAL_TYPES, {
  errorMap: () => ({ message: 'Tipo de meta inválido' }),
});
const goalPeriodSchema = z.enum(GOAL_PERIODS, {
  errorMap: () => ({ message: 'Período de meta inválido' }),
});

const targetValueSchema = z
  .number({
    required_error: 'Valor desejado é obrigatório',
    invalid_type_error: 'Valor desejado deve ser um número',
  })
  .int('Valor desejado deve ser um número inteiro')
  .min(1, 'Valor desejado deve ser positivo')
  .max(1000000, 'Valor desejado muito alto');

const rangeConsistency = (
  data: { startDate?: string; endDate?: string },
  context: z.RefinementCtx,
): void => {
  if (!data.startDate || !data.endDate) return;
  if (data.endDate < data.startDate) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endDate'],
      message: 'A data de término deve ser igual ou posterior à data de início',
    });
    return;
  }
  const days = (Date.parse(data.endDate) - Date.parse(data.startDate)) / DAY_MS;
  if (days > MAX_GOAL_DAYS) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endDate'],
      message: 'O intervalo da meta deve ter no máximo dois anos',
    });
  }
};

export const createGoalSchema = z
  .object({
    title: trimmedString('Título', 120),
    type: goalTypeSchema,
    period: goalPeriodSchema,
    targetValue: targetValueSchema,
    startDate: dateOnlyString('Data de início'),
    endDate: dateOnlyString('Data de término'),
  })
  .strict()
  .superRefine(rangeConsistency);

export const updateGoalSchema = z
  .object({
    title: trimmedString('Título', 120).optional(),
    type: goalTypeSchema.optional(),
    period: goalPeriodSchema.optional(),
    targetValue: targetValueSchema.optional(),
    startDate: dateOnlyString('Data de início').optional(),
    endDate: dateOnlyString('Data de término').optional(),
  })
  .strict()
  .superRefine(rangeConsistency)
  .refine((data) => Object.keys(data).length > 0, 'Informe ao menos um campo para atualizar');

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
