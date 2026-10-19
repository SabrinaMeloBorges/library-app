import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app';
import { loadConfig } from '../src/config/env';
import type { Repositories } from '../src/repositories/contracts';
import { createMemoryRepositories } from '../src/repositories/memory/memoryRepositories';
import { createPrismaRepositories } from '../src/repositories/prisma/prismaRepositories';

export const testConfig = loadConfig({
  NODE_ENV: 'test',
  DATA_STORE: 'memory',
  JWT_SECRET: 'test-secret-with-at-least-thirty-two-characters',
  BCRYPT_COST: '4',
  APP_TIMEZONE: 'America/Sao_Paulo',
  RATE_LIMIT_MAX_REQUESTS: '10000',
  AUTH_RATE_LIMIT_MAX_REQUESTS: '10000',
});

let prisma: PrismaClient | null = null;

const createTestRepositories = (): Repositories => {
  if (process.env.TEST_WITH_MYSQL !== '1') return createMemoryRepositories();
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error('Defina TEST_DATABASE_URL para rodar os testes com MySQL');
  prisma ??= new PrismaClient({ datasources: { db: { url } } });
  return createPrismaRepositories(prisma);
};

export const disconnectTestDatabase = async (): Promise<void> => {
  await prisma?.$disconnect();
  prisma = null;
};

export const buildTestApp = (): Express =>
  createApp({ config: testConfig, repositories: createTestRepositories() });

export interface TestUser {
  token: string;
  userId: string;
  email: string;
  password: string;
}

export const registerUser = async (app: Express, name = 'Leitora'): Promise<TestUser> => {
  const email = `leitora-${randomUUID()}@example.com`;
  const password = 'senhaSegura123';
  const response = await request(app)
    .post('/api/v1/auth/register')
    .send({ name, email, password })
    .expect(201);
  return { token: response.body.token, userId: response.body.user.id, email, password };
};

export const bearer = (token: string): [string, string] => ['Authorization', `Bearer ${token}`];

export const createLibraryItem = async (
  app: Express,
  token: string,
  overrides: Record<string, unknown> = {},
) => {
  const response = await request(app)
    .post('/api/v1/library')
    .set(...bearer(token))
    .send({ title: 'O Nome da Rosa', authors: 'Umberto Eco', totalPages: 500, ...overrides })
    .expect(201);
  return response.body.data;
};
