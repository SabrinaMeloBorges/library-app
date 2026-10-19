import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import { bearer, buildTestApp, createLibraryItem, registerUser, type TestUser } from '../helpers';

const hoursAgo = (hours: number): string =>
  new Date(Date.now() - hours * 3600 * 1000).toISOString();

const codesOf = (items: { code: string }[]): string[] => items.map((item) => item.code);

describe('Conquistas', () => {
  let app: Express;
  let user: TestUser;

  const pending = async () =>
    (
      await request(app)
        .get('/api/v1/achievements/pending')
        .set(...bearer(user.token))
        .expect(200)
    ).body.data;

  beforeEach(async () => {
    app = buildTestApp();
    user = await registerUser(app);
  });

  it('desbloqueia o primeiro acesso no cadastro e marca como vista', async () => {
    expect(codesOf(await pending())).toEqual(['FIRST_LOGIN']);
    await request(app)
      .post('/api/v1/achievements/seen')
      .set(...bearer(user.token))
      .send({ codes: ['FIRST_LOGIN'] })
      .expect(204);
    expect(await pending()).toEqual([]);
  });

  it('desbloqueia conquistas de leitura e mostra o progresso das bloqueadas', async () => {
    const book = await createLibraryItem(app, user.token, { totalPages: 300 });
    await request(app)
      .post('/api/v1/reading-sessions')
      .set(...bearer(user.token))
      .send({
        userBookId: book.id,
        startPage: 0,
        endPage: 120,
        durationMinutes: 90,
        readAt: hoursAgo(1),
      })
      .expect(201);

    expect(codesOf(await pending())).toEqual(
      expect.arrayContaining(['FIRST_LOGIN', 'FIRST_BOOK', 'FIRST_SESSION', 'PAGES_100']),
    );

    const all = await request(app)
      .get('/api/v1/achievements')
      .set(...bearer(user.token))
      .expect(200);
    const thousand = all.body.data.find((item: { code: string }) => item.code === 'PAGES_1000');
    expect(thousand).toMatchObject({
      unlocked: false,
      currentValue: 120,
      threshold: 1000,
      tier: 'SILVER',
    });
  });

  it('conclui a meta, registra no feed e desbloqueia "Meta batida"', async () => {
    const year = new Date().getFullYear();
    const created = await request(app)
      .post('/api/v1/goals')
      .set(...bearer(user.token))
      .send({
        title: 'Primeiro livro',
        type: 'BOOKS_FINISHED',
        period: 'YEARLY',
        targetValue: 1,
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`,
      })
      .expect(201);
    expect(created.body.data.completedAt).toBeNull();

    await createLibraryItem(app, user.token, { status: 'FINISHED' });

    const goal = await request(app)
      .get(`/api/v1/goals/${created.body.data.id}`)
      .set(...bearer(user.token))
      .expect(200);
    expect(goal.body.data.completedAt).not.toBeNull();
    expect(codesOf(await pending())).toEqual(
      expect.arrayContaining(['FIRST_GOAL', 'FIRST_BOOK_FINISHED']),
    );

    const feed = await request(app)
      .get('/api/v1/feed')
      .set(...bearer(user.token))
      .expect(200);
    expect(feed.body.data.some((entry: { type: string }) => entry.type === 'GOAL_COMPLETED')).toBe(
      true,
    );
  });

  it('expõe as conquistas desbloqueadas no perfil público', async () => {
    const other = await registerUser(app, 'Visitante');
    const response = await request(app)
      .get(`/api/v1/users/${user.userId}/achievements`)
      .set(...bearer(other.token))
      .expect(200);
    expect(codesOf(response.body.data)).toEqual(['FIRST_LOGIN']);
  });
});
