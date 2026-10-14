import { z } from 'zod';
import { optionalIsoDate, pageLimit, trimmedString } from './common';

export const openDirectSchema = z
  .object({ userId: z.string({ required_error: 'Pessoa é obrigatória' }).uuid('Pessoa inválida') })
  .strict();

export const sendMessageSchema = z.object({ body: trimmedString('Mensagem', 1000) }).strict();

export const messagesQuerySchema = z.object({
  after: optionalIsoDate('Data de referência'),
  before: optionalIsoDate('Data de referência'),
  limit: pageLimit(100, 50),
});

export type MessagesQuery = z.infer<typeof messagesQuerySchema>;
