import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app';
import { loadConfig } from '../src/config/env';
import { createMemoryRepositories } from '../src/repositories/memory/memoryRepositories';

export const testConfig = loadConfig({
  NODE_ENV: 'test',
  DATA_STORE: 'memory',
  JWT_SECRET: 'test-secret-with-at-least-thirty-two-characters',
  BCRYPT_COST: '4',
  APP_TIMEZONE: 'America/Sao_Paulo',
  RATE_LIMIT_MAX_REQUESTS: '10000',
  AUTH_RATE_LIMIT_MAX_REQUESTS: '10000',
});

export const buildTestApp = (): Express =>
  createApp({ config: testConfig, repositories: createMemoryRepositories() });

let userCounter = 0;

export interface TestUser {
  token: string;
  userId: string;
  email: string;
  password: string;
}

export const registerUser = async (app: Express, name = 'Leitora'): Promise<TestUser> => {
  userCounter += 1;
  const email = `leitora${userCounter}@example.com`;
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
