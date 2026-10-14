import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import { bearer, buildTestApp, createLibraryItem, registerUser, type TestUser } from '../helpers';

const hoursAgo = (hours: number): string =>
  new Date(Date.now() - hours * 3600 * 1000).toISOString();

describe('Sessões de leitura', () => {
  let app: Express;
  let user: TestUser;
  let bookId: string;

  const createSession = (body: Record<string, unknown>, token = user.token) =>
    request(app)
      .post('/api/v1/reading-sessions')
      .set(...bearer(token))
      .send({ userBookId: bookId, durationMinutes: 30, readAt: hoursAgo(2), ...body });

  const getBook = async () =>
    (
      await request(app)
        .get(`/api/v1/library/${bookId}`)
        .set(...bearer(user.token))
        .expect(200)
    ).body.data;

  beforeEach(async () => {
    app = buildTestApp();
    user = await registerUser(app);
    bookId = (await createLibraryItem(app, user.token, { totalPages: 100 })).id;
  });

  it('registra sessão, calcula páginas lidas e atualiza o progresso', async () => {
    const response = await createSession({ startPage: 0, endPage: 30 }).expect(201);
    expect(response.body.data.pagesRead).toBe(30);

    const book = await getBook();
    expect(book).toMatchObject({ currentPage: 30, status: 'READING', progress: 30 });
  });

  it('valida páginas inconsistentes e datas futuras', async () => {
    await createSession({ startPage: 20, endPage: 10 }).expect(400);
    await createSession({ startPage: 0, endPage: 120 }).expect(400);
    await createSession({
      startPage: 0,
      endPage: 10,
      readAt: new Date(Date.now() + 86400000).toISOString(),
    }).expect(400);
    await createSession({ startPage: 0, endPage: 10, durationMinutes: 0 }).expect(400);
  });

  it('conclui o livro ao registrar a última página', async () => {
    await createSession({ startPage: 0, endPage: 100 }).expect(201);
    const book = await getBook();
    expect(book.status).toBe('FINISHED');
    expect(book.finishedAt).not.toBeNull();
  });

  it('recalcula o progresso ao editar e remover sessões', async () => {
    await createSession({ startPage: 0, endPage: 40, readAt: hoursAgo(5) }).expect(201);
    const second = await createSession({ startPage: 40, endPage: 70 }).expect(201);

    await request(app)
      .patch(`/api/v1/reading-sessions/${second.body.data.id}`)
      .set(...bearer(user.token))
      .send({ endPage: 60 })
      .expect(200);
    expect((await getBook()).currentPage).toBe(60);

    await request(app)
      .delete(`/api/v1/reading-sessions/${second.body.data.id}`)
      .set(...bearer(user.token))
      .expect(204);
    expect((await getBook()).currentPage).toBe(40);
  });

  it('não conta páginas repetidas nas estatísticas', async () => {
    await createSession({ startPage: 0, endPage: 40 }).expect(201);
    await createSession({ startPage: 20, endPage: 50 }).expect(201);

    const overview = await request(app)
      .get('/api/v1/statistics/overview')
      .set(...bearer(user.token))
      .expect(200);
    expect(overview.body.data.allTime.pagesRead).toBe(50);
    expect(overview.body.data.allTime.minutesRead).toBe(60);
  });

  it('lista o histórico filtrado por livro', async () => {
    await createSession({ startPage: 0, endPage: 10 }).expect(201);
    const response = await request(app)
      .get(`/api/v1/reading-sessions?userBookId=${bookId}`)
      .set(...bearer(user.token))
      .expect(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].bookTitle).toBe('O Nome da Rosa');
  });

  it('impede registrar ou alterar sessões em livros de outro usuário', async () => {
    const intruder = await registerUser(app, 'Intrusa');
    await createSession({ startPage: 0, endPage: 10 }, intruder.token).expect(404);

    const session = await createSession({ startPage: 0, endPage: 10 }).expect(201);
    await request(app)
      .delete(`/api/v1/reading-sessions/${session.body.data.id}`)
      .set(...bearer(intruder.token))
      .expect(404);
    const history = await request(app)
      .get('/api/v1/reading-sessions')
      .set(...bearer(intruder.token))
      .expect(200);
    expect(history.body.data).toHaveLength(0);
  });
});
