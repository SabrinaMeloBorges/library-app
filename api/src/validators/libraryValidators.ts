import { z } from 'zod';
import { READING_STATUSES } from '../domain/entities';
import { optionalTrimmedString, pageNumber, trimmedString } from './common';

const statusSchema = z.enum(READING_STATUSES, {
  errorMap: () => ({ message: 'Status de leitura inválido' }),
});

const ratingSchema = z
  .number({ invalid_type_error: 'Avaliação deve ser um número' })
  .int('Avaliação deve ser um número inteiro')
  .min(1, 'Avaliação deve ser entre 1 e 5')
  .max(5, 'Avaliação deve ser entre 1 e 5')
  .nullable()
  .optional();

const coverUrlSchema = z
  .string()
  .trim()
  .max(500, 'URL da capa muito longa')
  .url('URL da capa inválida')
  .refine((value) => value.startsWith('https://'), 'A capa deve usar HTTPS')
  .nullable()
  .optional();

const pageConsistency = (
  data: { currentPage?: number; totalPages?: number },
  context: z.RefinementCtx,
): void => {
  if (
    data.currentPage !== undefined &&
    data.totalPages !== undefined &&
    data.currentPage > data.totalPages
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['currentPage'],
      message: 'A página atual não pode ser maior que o total de páginas',
    });
  }
};

const bookFields = {
  title: trimmedString('Título', 255),
  authors: trimmedString('Autor', 255),
  publisher: optionalTrimmedString('Editora', 160),
  coverUrl: coverUrlSchema,
  isbn: optionalTrimmedString('ISBN', 20),
};

const userBookFields = {
  totalPages: pageNumber('Número de páginas', 1),
  currentPage: pageNumber('Página atual'),
  status: statusSchema,
  isFavorite: z.boolean({ invalid_type_error: 'Favorito deve ser verdadeiro ou falso' }),
  rating: ratingSchema,
  review: optionalTrimmedString('Resenha', 5000),
};

export const createLibraryItemSchema = z
  .object({
    ...bookFields,
    description: optionalTrimmedString('Descrição', 5000),
    subjects: optionalTrimmedString('Assuntos', 255),
    externalSource: z.enum(['openlibrary']).nullable().optional(),
    externalId: z
      .string()
      .trim()
      .max(120)
      .regex(/^[A-Za-z0-9/_-]+$/, 'Identificador externo inválido')
      .nullable()
      .optional(),
    ...userBookFields,
    currentPage: userBookFields.currentPage.default(0),
    status: userBookFields.status.optional(),
    isFavorite: userBookFields.isFavorite.default(false),
  })
  .strict()
  .superRefine(pageConsistency)
  .superRefine((data, context) => {
    if (Boolean(data.externalSource) !== Boolean(data.externalId)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['externalId'],
        message: 'Origem e identificador externo devem ser informados juntos',
      });
    }
  });

export const updateLibraryItemSchema = z
  .object({
    title: bookFields.title.optional(),
    authors: bookFields.authors.optional(),
    publisher: bookFields.publisher,
    coverUrl: bookFields.coverUrl,
    isbn: bookFields.isbn,
    totalPages: userBookFields.totalPages.optional(),
    currentPage: userBookFields.currentPage.optional(),
    status: userBookFields.status.optional(),
    isFavorite: userBookFields.isFavorite.optional(),
    rating: userBookFields.rating,
    review: userBookFields.review,
  })
  .strict()
  .superRefine(pageConsistency)
  .refine((data) => Object.keys(data).length > 0, 'Informe ao menos um campo para atualizar');

export const libraryQuerySchema = z.object({
  status: statusSchema.optional(),
  q: z.string().trim().max(100).optional(),
  favorites: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  sort: z.enum(['title', 'updatedAt', 'createdAt', 'progress', 'rating']).default('updatedAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateLibraryItemInput = z.infer<typeof createLibraryItemSchema>;
export type UpdateLibraryItemInput = z.infer<typeof updateLibraryItemSchema>;
export type LibraryQuery = z.infer<typeof libraryQuerySchema>;
