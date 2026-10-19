import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import { bearer, buildTestApp, registerUser } from '../helpers';

describe('Autenticação', () => {
  let app: Express;

  beforeEach(() => {
    app = buildTestApp();
  });

  it('cadastra usuário e retorna token sem expor o hash da senha', async () => {
    const suffix = randomUUID();
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Ana', email: `ANA-${suffix}@Example.com `, password: 'leitura2026' })
      .expect(201);

    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({ name: 'Ana', email: `ana-${suffix}@example.com` });
    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it('rejeita cadastro com dados inválidos', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: '', email: 'invalido', password: '123' })
      .expect(400);

    const fields = response.body.error.details.map((detail: { field: string }) => detail.field);
    expect(fields).toEqual(expect.arrayContaining(['name', 'email', 'password']));
  });

  it('impede e-mail duplicado', async () => {
    const user = await registerUser(app);
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Outra', email: user.email, password: 'outraSenha123' })
      .expect(409);
  });

  it('faz login com credenciais válidas e rejeita senha incorreta', async () => {
    const user = await registerUser(app);
    const ok = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: user.password })
      .expect(200);
    expect(ok.body.token).toEqual(expect.any(String));

    const wrong = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: 'senhaErrada1' })
      .expect(401);
    expect(wrong.body.error.message).toBe('E-mail ou senha incorretos');
  });

  it('retorna o usuário autenticado em /me', async () => {
    const user = await registerUser(app, 'Beatriz');
    const response = await request(app)
      .get('/api/v1/auth/me')
      .set(...bearer(user.token))
      .expect(200);
    expect(response.body.user).toMatchObject({ id: user.userId, name: 'Beatriz' });
  });

  it('exige token nas rotas protegidas', async () => {
    await request(app).get('/api/v1/auth/me').expect(401);
    await request(app).get('/api/v1/library').set('Authorization', 'Bearer invalido').expect(401);
    await request(app).get('/api/v1/library').set('Authorization', 'Bearer a.b.c').expect(401);
  });

  it('invalida o token no logout', async () => {
    const user = await registerUser(app);
    await request(app)
      .post('/api/v1/auth/logout')
      .set(...bearer(user.token))
      .expect(204);
    await request(app)
      .get('/api/v1/auth/me')
      .set(...bearer(user.token))
      .expect(401);
  });
});
