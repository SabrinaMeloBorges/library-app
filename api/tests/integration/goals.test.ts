import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import { bearer, buildTestApp, createLibraryItem, registerUser, type TestUser } from '../helpers';

const currentYear = Number(
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric' }).format(
    new Date(),
  ),
);

const yearlyGoal = {
  title: 'Doze livros no ano',
  type: 'BOOKS_FINISHED',
  period: 'YEARLY',
  targetValue: 12,
  startDate: `${currentYear}-01-01`,
  endDate: `${currentYear}-12-31`,
};

describe('Metas e estatísticas', () => {
  let app: Express;
  let user: TestUser;

  beforeEach(async () => {
    app = buildTestApp();
    user = await registerUser(app);
  });

  it('cria meta e calcula o progresso a partir dos livros concluídos', async () => {
    await createLibraryItem(app, user.token, { status: 'FINISHED' });
    const response = await request(app)
      .post('/api/v1/goals')
      .set(...bearer(user.token))
      .send(yearlyGoal)
      .expect(201);
    expect(response.body.data).toMatchObject({
      currentValue: 1,
      percentage: 8,
      state: 'ACTIVE',
      startDate: `${currentYear}-01-01`,
    });
  });

  it('valida valores e intervalos', async () => {
    await request(app)
      .post('/api/v1/goals')
      .set(...bearer(user.token))
      .send({ ...yearlyGoal, targetValue: 0 })
      .expect(400);
    await request(app)
      .post('/api/v1/goals')
      .set(...bearer(user.token))
      .send({ ...yearlyGoal, startDate: `${currentYear}-06-01`, endDate: `${currentYear}-01-01` })
      .expect(400);
  });

  it('atualiza e remove meta, respeitando o dono', async () => {
    const created = await request(app)
      .post('/api/v1/goals')
      .set(...bearer(user.token))
      .send(yearlyGoal)
      .expect(201);
    const goalId = created.body.data.id;

    const updated = await request(app)
      .patch(`/api/v1/goals/${goalId}`)
      .set(...bearer(user.token))
      .send({ targetValue: 1 })
      .expect(200);
    expect(updated.body.data.targetValue).toBe(1);

    await request(app)
      .patch(`/api/v1/goals/${goalId}`)
      .set(...bearer(user.token))
      .send({ endDate: `${currentYear - 1}-01-01` })
      .expect(400);

    const intruder = await registerUser(app, 'Intrusa');
    await request(app)
      .delete(`/api/v1/goals/${goalId}`)
      .set(...bearer(intruder.token))
      .expect(404);
    await request(app)
      .delete(`/api/v1/goals/${goalId}`)
      .set(...bearer(user.token))
      .expect(204);
  });

  it('monta o dashboard com dados reais do usuário', async () => {
    await createLibraryItem(app, user.token, { title: 'Lendo agora', currentPage: 10 });
    await createLibraryItem(app, user.token, { title: 'Concluído', status: 'FINISHED' });
    await request(app)
      .post('/api/v1/goals')
      .set(...bearer(user.token))
      .send(yearlyGoal)
      .expect(201);

    const response = await request(app)
      .get('/api/v1/statistics/overview')
      .set(...bearer(user.token))
      .expect(200);
    const overview = response.body.data;

    expect(overview.year).toBe(currentYear);
    expect(overview.totalBooks).toBe(2);
    expect(overview.readingNowCount).toBe(1);
    expect(overview.thisYear.booksFinished).toBe(1);
    expect(overview.statusDistribution).toMatchObject({ READING: 1, FINISHED: 1, WANT_TO_READ: 0 });
    expect(overview.annualGoal).toMatchObject({ currentValue: 1, targetValue: 12 });
    expect(overview.continueReading[0].book.title).toBe('Lendo agora');
    expect(overview.recentActivity[0]).toMatchObject({ type: 'FINISHED', bookTitle: 'Concluído' });
  });

  it('retorna dashboard vazio para usuário novo', async () => {
    const response = await request(app)
      .get('/api/v1/statistics/overview')
      .set(...bearer(user.token))
      .expect(200);
    expect(response.body.data).toMatchObject({
      totalBooks: 0,
      annualGoal: null,
      continueReading: [],
      recentActivity: [],
    });
  });
});
