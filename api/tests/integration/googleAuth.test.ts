import request from 'supertest';
import { describe, expect, it } from 'vitest';
import type { GoogleIdentity, GoogleTokenVerifier } from '../../src/services/googleTokenVerifier';
import { buildTestApp, registerUser } from '../helpers';

const fakeVerifier = (identities: Record<string, GoogleIdentity>): GoogleTokenVerifier => ({
  verify: async (idToken) => identities[idToken] ?? null,
});

describe('Login com Google', () => {
  it('cria a conta no primeiro acesso e reutiliza nas próximas', async () => {
    const identity = {
      googleId: 'google-123',
      email: 'nova@example.com',
      emailVerified: true,
      name: 'Nova Leitora',
    };
    const app = buildTestApp(fakeVerifier({ valid: identity }));

    const first = await request(app)
      .post('/api/v1/auth/google')
      .send({ idToken: 'valid' })
      .expect(200);
    expect(first.body.user).toMatchObject({ name: 'Nova Leitora', email: 'nova@example.com' });
    expect(first.body.user.googleId).toBeUndefined();

    const second = await request(app)
      .post('/api/v1/auth/google')
      .send({ idToken: 'valid' })
      .expect(200);
    expect(second.body.user.id).toBe(first.body.user.id);
  });

  it('vincula a uma conta existente com o mesmo e-mail', async () => {
    const verifier = fakeVerifier({});
    const app = buildTestApp(verifier);
    const user = await registerUser(app);
    Object.assign(verifier, {
      verify: async () => ({ googleId: 'g-1', email: user.email, emailVerified: true, name: 'X' }),
    });

    const response = await request(app)
      .post('/api/v1/auth/google')
      .send({ idToken: 't' })
      .expect(200);
    expect(response.body.user.id).toBe(user.userId);
  });

  it('rejeita token inválido ou e-mail não verificado', async () => {
    const app = buildTestApp(
      fakeVerifier({
        unverified: { googleId: 'g-2', email: 'x@example.com', emailVerified: false, name: 'X' },
      }),
    );
    await request(app).post('/api/v1/auth/google').send({ idToken: 'bad' }).expect(401);
    await request(app).post('/api/v1/auth/google').send({ idToken: 'unverified' }).expect(401);
  });

  it('retorna 503 quando o Google não está configurado', async () => {
    await request(buildTestApp()).post('/api/v1/auth/google').send({ idToken: 'x' }).expect(503);
  });
});
