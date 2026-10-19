import { randomInt } from 'node:crypto';
import { AppError } from '../errors/AppError';
import type { UserRepository } from '../repositories/contracts';

const MAX_BASE_LENGTH = 24;
const MIN_BASE_LENGTH = 3;
const MAX_ATTEMPTS = 20;

export const usernameBaseFromName = (name: string): string => {
  const base = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, MAX_BASE_LENGTH);
  return base.length >= MIN_BASE_LENGTH ? base : `leitor${base}`;
};

export const ensureUsernameAvailable = async (
  users: UserRepository,
  username: string,
  currentUserId?: string,
): Promise<void> => {
  const owner = await users.findByUsername(username);
  if (owner && owner.id !== currentUserId) {
    throw AppError.conflict('Este nome de usuário já está em uso');
  }
};

export const generateUsername = async (users: UserRepository, name: string): Promise<string> => {
  const base = usernameBaseFromName(name);
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}${randomInt(1000, 10000)}`;
    if (!(await users.findByUsername(candidate))) return candidate;
  }
  throw new AppError(500, 'INTERNAL_ERROR', 'Não foi possível gerar um nome de usuário');
};
