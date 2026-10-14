import type { GoalPeriod, GoalType, ReadingGoalInput, ReadingStatus } from '../types/api';
import { combineDateAndTime, isValidDateKey, isValidTimeKey } from './dates';

export type FormErrors<Field extends string> = Partial<Record<Field, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PAGES = 100000;

export const hasErrors = <Field extends string>(errors: FormErrors<Field>): boolean =>
  Object.values(errors).some(Boolean);

const parseInteger = (value: string): number | null => {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  return Number(trimmed);
};

export interface LoginFormValues {
  email: string;
  password: string;
}

export const validateLoginForm = (values: LoginFormValues): FormErrors<keyof LoginFormValues> => ({
  email: !values.email.trim()
    ? 'Informe seu e-mail'
    : !EMAIL_PATTERN.test(values.email.trim())
      ? 'E-mail inválido'
      : undefined,
  password: !values.password ? 'Informe sua senha' : undefined,
});

export interface RegisterFormValues extends LoginFormValues {
  name: string;
  confirmPassword: string;
}

export const validateRegisterForm = (
  values: RegisterFormValues,
): FormErrors<keyof RegisterFormValues> => {
  const password = values.password;
  let passwordError: string | undefined;
  if (password.length < 8) passwordError = 'A senha deve ter pelo menos 8 caracteres';
  else if (password.length > 72) passwordError = 'A senha deve ter no máximo 72 caracteres';
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password))
    passwordError = 'Use letras e números na senha';

  return {
    name: !values.name.trim()
      ? 'Informe seu nome'
      : values.name.trim().length > 80
        ? 'Use no máximo 80 caracteres'
        : undefined,
    email: validateLoginForm(values).email,
    password: passwordError,
    confirmPassword: values.confirmPassword !== password ? 'As senhas não conferem' : undefined,
  };
};

export interface BookFormValues {
  title: string;
  authors: string;
  publisher: string;
  totalPages: string;
  currentPage: string;
  status: ReadingStatus;
  isFavorite: boolean;
}

export const validateBookForm = (values: BookFormValues): FormErrors<keyof BookFormValues> => {
  const totalPages = parseInteger(values.totalPages);
  const currentPage = values.currentPage.trim() === '' ? 0 : parseInteger(values.currentPage);
  const errors: FormErrors<keyof BookFormValues> = {};

  if (!values.title.trim()) errors.title = 'Informe o título';
  else if (values.title.trim().length > 255) errors.title = 'Use no máximo 255 caracteres';

  if (!values.authors.trim()) errors.authors = 'Informe o autor';
  else if (values.authors.trim().length > 255) errors.authors = 'Use no máximo 255 caracteres';

  if (values.publisher.trim().length > 160) errors.publisher = 'Use no máximo 160 caracteres';

  if (totalPages === null || totalPages < 1)
    errors.totalPages = 'Informe um número positivo de páginas';
  else if (totalPages > MAX_PAGES) errors.totalPages = 'Número de páginas muito alto';

  if (currentPage === null)
    errors.currentPage = 'Informe um número inteiro igual ou maior que zero';
  else if (totalPages !== null && currentPage > totalPages)
    errors.currentPage = 'A página atual não pode passar do total de páginas';

  return errors;
};

export interface SessionFormValues {
  startPage: string;
  endPage: string;
  durationMinutes: string;
  date: string;
  time: string;
  note: string;
}

export const validateSessionForm = (
  values: SessionFormValues,
  totalPages: number,
  now: Date = new Date(),
): FormErrors<keyof SessionFormValues> => {
  const errors: FormErrors<keyof SessionFormValues> = {};
  const startPage = parseInteger(values.startPage);
  const endPage = parseInteger(values.endPage);
  const duration = parseInteger(values.durationMinutes);

  if (startPage === null) errors.startPage = 'Informe a página inicial';
  if (endPage === null || endPage < 1) errors.endPage = 'Informe a página final';
  else if (startPage !== null && endPage <= startPage)
    errors.endPage = 'A página final deve ser maior que a inicial';
  else if (endPage > totalPages) errors.endPage = `O livro possui ${totalPages} páginas`;

  if (duration === null || duration < 1) errors.durationMinutes = 'Informe a duração em minutos';
  else if (duration > 1440) errors.durationMinutes = 'A duração máxima é de 1440 minutos';

  if (!isValidDateKey(values.date)) errors.date = 'Use o formato AAAA-MM-DD';
  if (!isValidTimeKey(values.time)) errors.time = 'Use o formato HH:MM';
  if (!errors.date && !errors.time && combineDateAndTime(values.date, values.time) > now) {
    errors.time = 'A sessão não pode estar no futuro';
  }

  if (values.note.length > 1000) errors.note = 'Use no máximo 1000 caracteres';
  return errors;
};

export interface GoalFormValues {
  title: string;
  type: GoalType;
  period: GoalPeriod;
  targetValue: string;
  startDate: string;
  endDate: string;
}

export const validateGoalForm = (values: GoalFormValues): FormErrors<keyof GoalFormValues> => {
  const errors: FormErrors<keyof GoalFormValues> = {};
  const target = parseInteger(values.targetValue);

  if (!values.title.trim()) errors.title = 'Informe um título';
  else if (values.title.trim().length > 120) errors.title = 'Use no máximo 120 caracteres';

  if (target === null || target < 1) errors.targetValue = 'Informe um valor positivo';
  else if (target > 1000000) errors.targetValue = 'Valor muito alto';

  if (!isValidDateKey(values.startDate)) errors.startDate = 'Use o formato AAAA-MM-DD';
  if (!isValidDateKey(values.endDate)) errors.endDate = 'Use o formato AAAA-MM-DD';
  else if (!errors.startDate && values.endDate < values.startDate)
    errors.endDate = 'O término deve ser igual ou posterior ao início';

  return errors;
};

export const toGoalPayload = (values: GoalFormValues): ReadingGoalInput => ({
  title: values.title.trim(),
  type: values.type,
  period: values.period,
  targetValue: Number(values.targetValue.trim()),
  startDate: values.startDate,
  endDate: values.endDate,
});
