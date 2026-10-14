import { z } from 'zod';
import { optionalTrimmedString, pageNumber } from './common';

const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

const readAtSchema = z
  .string({ required_error: 'Data da leitura é obrigatória' })
  .datetime({ offset: true, message: 'Data da leitura inválida' })
  .transform((value) => new Date(value))
  .refine(
    (date) => date.getTime() <= Date.now() + MAX_CLOCK_SKEW_MS,
    'A data da leitura não pode estar no futuro',
  );

const durationSchema = z
  .number({
    required_error: 'Duração é obrigatória',
    invalid_type_error: 'Duração deve ser um número',
  })
  .int('Duração deve ser um número inteiro de minutos')
  .min(1, 'A duração deve ser de pelo menos 1 minuto')
  .max(1440, 'A duração deve ser de no máximo 1440 minutos');

const pageOrder = (
  data: { startPage?: number; endPage?: number },
  context: z.RefinementCtx,
): void => {
  if (
    data.startPage !== undefined &&
    data.endPage !== undefined &&
    data.endPage <= data.startPage
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endPage'],
      message: 'A página final deve ser maior que a página inicial',
    });
  }
};

export const createReadingSessionSchema = z
  .object({
    userBookId: z.string({ required_error: 'Livro é obrigatório' }).uuid('Livro inválido'),
    startPage: pageNumber('Página inicial'),
    endPage: pageNumber('Página final', 1),
    durationMinutes: durationSchema,
    readAt: readAtSchema,
    note: optionalTrimmedString('Observação', 1000),
  })
  .strict()
  .superRefine(pageOrder);

export const updateReadingSessionSchema = z
  .object({
    startPage: pageNumber('Página inicial').optional(),
    endPage: pageNumber('Página final', 1).optional(),
    durationMinutes: durationSchema.optional(),
    readAt: readAtSchema.optional(),
    note: optionalTrimmedString('Observação', 1000),
  })
  .strict()
  .superRefine(pageOrder)
  .refine((data) => Object.keys(data).length > 0, 'Informe ao menos um campo para atualizar');

export const readingSessionQuerySchema = z.object({
  userBookId: z.string().uuid('Livro inválido').optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export type CreateReadingSessionInput = z.infer<typeof createReadingSessionSchema>;
export type UpdateReadingSessionInput = z.infer<typeof updateReadingSessionSchema>;
export type ReadingSessionQuery = z.infer<typeof readingSessionQuerySchema>;
