import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import { bearer, buildTestApp, createLibraryItem, registerUser, type TestUser } from '../helpers';

describe('Biblioteca', () => {
  let app: Express;
  let user: TestUser;

  beforeEach(async () => {
    app = buildTestApp();
    user = await registerUser(app);
  });

  it('cria livro manual com favorito persistido', async () => {
    const item = await createLibraryItem(app, user.token, { isFavorite: true, currentPage: 50 });
    expect(item).toMatchObject({
      status: 'READING',
      currentPage: 50,
      totalPages: 500,
      progress: 10,
      isFavorite: true,
      book: { title: 'O Nome da Rosa', authors: 'Umberto Eco' },
    });
  });

  it('valida página atual maior que o total no backend', async () => {
    const response = await request(app)
      .post('/api/v1/library')
      .set(...bearer(user.token))
      .send({ title: 'Livro', authors: 'Autor', totalPages: 100, currentPage: 101 })
      .expect(400);
    expect(response.body.error.details[0].field).toBe('currentPage');
  });

  it('lista, filtra por status, pesquisa e ordena', async () => {
    await createLibraryItem(app, user.token, {
      title: 'Dom Casmurro',
      authors: 'Machado de Assis',
      totalPages: 200,
    });
    await createLibraryItem(app, user.token, {
      title: 'Amada',
      authors: 'Toni Morrison',
      totalPages: 300,
      status: 'FINISHED',
    });

    const all = await request(app)
      .get('/api/v1/library?sort=title&order=asc')
      .set(...bearer(user.token))
      .expect(200);
    expect(all.body.data.map((item: { book: { title: string } }) => item.book.title)).toEqual([
      'Amada',
      'Dom Casmurro',
    ]);

    const finished = await request(app)
      .get('/api/v1/library?status=FINISHED')
      .set(...bearer(user.token))
      .expect(200);
    expect(finished.body.data).toHaveLength(1);

    const search = await request(app)
      .get('/api/v1/library?q=machado')
      .set(...bearer(user.token))
      .expect(200);
    expect(search.body.data[0].book.title).toBe('Dom Casmurro');
  });

  it('consulta, atualiza e remove um livro', async () => {
    const item = await createLibraryItem(app, user.token);

    await request(app)
      .get(`/api/v1/library/${item.id}`)
      .set(...bearer(user.token))
      .expect(200);

    const updated = await request(app)
      .patch(`/api/v1/library/${item.id}`)
      .set(...bearer(user.token))
      .send({
        title: 'O Nome da Rosa (edição revista)',
        rating: 5,
        status: 'FINISHED',
        isFavorite: true,
      })
      .expect(200);
    expect(updated.body.data).toMatchObject({
      status: 'FINISHED',
      currentPage: 500,
      rating: 5,
      isFavorite: true,
      book: { title: 'O Nome da Rosa (edição revista)' },
    });
    expect(updated.body.data.finishedAt).not.toBeNull();

    await request(app)
      .delete(`/api/v1/library/${item.id}`)
      .set(...bearer(user.token))
      .expect(204);
    await request(app)
      .get(`/api/v1/library/${item.id}`)
      .set(...bearer(user.token))
      .expect(404);
  });

  it('rejeita atualização que deixa a página atual acima do total', async () => {
    const item = await createLibraryItem(app, user.token, { currentPage: 300 });
    await request(app)
      .patch(`/api/v1/library/${item.id}`)
      .set(...bearer(user.token))
      .send({ totalPages: 200 })
      .expect(400);
  });

  it('retorna 400 para identificador inválido', async () => {
    await request(app)
      .get('/api/v1/library/nao-e-uuid')
      .set(...bearer(user.token))
      .expect(400);
  });

  it('reaproveita livro do catálogo externo e cria cópia pessoal ao editar', async () => {
    const other = await registerUser(app, 'Outra');
    const external = {
      externalSource: 'openlibrary',
      externalId: 'works/OL1W',
      title: 'Duna',
      authors: 'Frank Herbert',
      totalPages: 600,
    };
    const mine = await createLibraryItem(app, user.token, external);
    const theirs = await createLibraryItem(app, other.token, external);
    expect(mine.book.id).toBe(theirs.book.id);

    await request(app)
      .post('/api/v1/library')
      .set(...bearer(user.token))
      .send(external)
      .expect(409);

    const unchanged = await request(app)
      .patch(`/api/v1/library/${mine.id}`)
      .set(...bearer(user.token))
      .send({ title: 'Duna', authors: 'Frank Herbert', currentPage: 10 })
      .expect(200);
    expect(unchanged.body.data.book.id).toBe(theirs.book.id);

    const edited = await request(app)
      .patch(`/api/v1/library/${mine.id}`)
      .set(...bearer(user.token))
      .send({ title: 'Duna — edição de bolso' })
      .expect(200);
    expect(edited.body.data.book.id).not.toBe(theirs.book.id);

    const theirsAfter = await request(app)
      .get(`/api/v1/library/${theirs.id}`)
      .set(...bearer(other.token))
      .expect(200);
    expect(theirsAfter.body.data.book.title).toBe('Duna');
  });

  it('isola os livros entre usuários', async () => {
    const item = await createLibraryItem(app, user.token);
    const intruder = await registerUser(app, 'Intrusa');

    await request(app)
      .get(`/api/v1/library/${item.id}`)
      .set(...bearer(intruder.token))
      .expect(404);
    await request(app)
      .patch(`/api/v1/library/${item.id}`)
      .set(...bearer(intruder.token))
      .send({ rating: 1 })
      .expect(404);
    await request(app)
      .delete(`/api/v1/library/${item.id}`)
      .set(...bearer(intruder.token))
      .expect(404);

    const list = await request(app)
      .get('/api/v1/library')
      .set(...bearer(intruder.token))
      .expect(200);
    expect(list.body.data).toHaveLength(0);

    const stillThere = await request(app)
      .get(`/api/v1/library/${item.id}`)
      .set(...bearer(user.token))
      .expect(200);
    expect(stillThere.body.data.rating).toBeNull();
  });
});
