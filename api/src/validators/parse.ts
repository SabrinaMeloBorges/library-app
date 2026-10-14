import type { ZodTypeAny, z } from 'zod';
import { AppError } from '../errors/AppError';

export const parseOrThrow = <Schema extends ZodTypeAny>(
  schema: Schema,
  data: unknown,
): z.output<Schema> => {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  const details = result.error.issues.map((issue) => ({
    field: issue.path.join('.') || 'body',
    message: issue.message,
  }));
  throw AppError.validation('Dados inválidos', details);
};
