import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import { bearer, buildTestApp, createLibraryItem, registerUser, type TestUser } from '../helpers';

const hoursAgo = (hours: number): string =>
  new Date(Date.now() - hours * 3600 * 1000).toISOString();
const year = new Date().getFullYear();

const befriend = async (app: Express, first: TestUser, second: TestUser) => {
  await request(app)
    .post(`/api/v1/users/${second.userId}/follow`)
    .set(...bearer(first.token))
    .expect(200);
  await request(app)
    .post(`/api/v1/users/${first.userId}/follow`)
    .set(...bearer(second.token))
    .expect(200);
};

describe('Clubes do livro', () => {
  let app: Express;
  let owner: TestUser;
  let friend: TestUser;
  let stranger: TestUser;

  const createClub = async () => {
    const book = await createLibraryItem(app, owner.token, {
      title: 'O Morro dos Ventos Uivantes',
    });
    const response = await request(app)
      .post('/api/v1/clubs')
      .set(...bearer(owner.token))
      .send({
        name: 'Clube das Brontë',
        description: 'Clássicos góticos',
        currentUserBookId: book.id,
      })
      .expect(201);
    return response.body.data;
  };

  beforeEach(async () => {
    app = buildTestApp();
    owner = await registerUser(app, 'Dona do Clube');
    friend = await registerUser(app, 'Amiga');
    stranger = await registerUser(app, 'Estranha');
    await befriend(app, owner, friend);
  });

  it('cria o clube com convite, livro atual e conversa do grupo', async () => {
    const club = await createClub();
    expect(club).toMatchObject({
      name: 'Clube das Brontë',
      viewerRole: 'OWNER',
      currentBook: { title: 'O Morro dos Ventos Uivantes' },
    });
    expect(club.inviteCode).toMatch(/^[A-Z0-9]{8}$/);
    expect(club.conversationId).toEqual(expect.any(String));

    const list = await request(app)
      .get('/api/v1/clubs')
      .set(...bearer(owner.token))
      .expect(200);
    expect(list.body.data[0]).toMatchObject({ memberCount: 1, isOwner: true });
  });

  it('adiciona apenas amigos e permite entrar pelo código', async () => {
    const club = await createClub();
    await request(app)
      .post(`/api/v1/clubs/${club.id}/members`)
      .set(...bearer(owner.token))
      .send({ userId: stranger.userId })
      .expect(403);

    const withFriend = await request(app)
      .post(`/api/v1/clubs/${club.id}/members`)
      .set(...bearer(owner.token))
      .send({ userId: friend.userId })
      .expect(200);
    expect(withFriend.body.data.members).toHaveLength(2);

    await request(app)
      .get(`/api/v1/clubs/${club.id}`)
      .set(...bearer(stranger.token))
      .expect(404);
    await request(app)
      .post('/api/v1/clubs/join')
      .set(...bearer(stranger.token))
      .send({ inviteCode: club.inviteCode.toLowerCase() })
      .expect(200);
    await request(app)
      .post('/api/v1/clubs/join')
      .set(...bearer(stranger.token))
      .send({ inviteCode: 'ZZZZZZZZ' })
      .expect(404);
  });

  it('soma o progresso dos membros nas metas coletivas', async () => {
    const club = await createClub();
    await request(app)
      .post(`/api/v1/clubs/${club.id}/members`)
      .set(...bearer(owner.token))
      .send({ userId: friend.userId })
      .expect(200);

    const goalPayload = {
      title: 'Juntos: 100 páginas',
      type: 'PAGES_READ',
      period: 'YEARLY',
      targetValue: 100,
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
    };
    await request(app)
      .post(`/api/v1/clubs/${club.id}/goals`)
      .set(...bearer(friend.token))
      .send(goalPayload)
      .expect(403);
    const withGoal = await request(app)
      .post(`/api/v1/clubs/${club.id}/goals`)
      .set(...bearer(owner.token))
      .send(goalPayload)
      .expect(201);
    const goalId = withGoal.body.data.goals[0].id;

    const ownerBook = await createLibraryItem(app, owner.token, { title: 'Jane Eyre' });
    const friendBook = await createLibraryItem(app, friend.token, { title: 'Agnes Grey' });
    const readPages = (user: TestUser, userBookId: string, endPage: number) =>
      request(app)
        .post('/api/v1/reading-sessions')
        .set(...bearer(user.token))
        .send({ userBookId, startPage: 0, endPage, durationMinutes: 30, readAt: hoursAgo(1) })
        .expect(201);
    await readPages(owner, ownerBook.id, 40);
    await readPages(friend, friendBook.id, 70);

    const details = await request(app)
      .get(`/api/v1/clubs/${club.id}`)
      .set(...bearer(friend.token))
      .expect(200);
    const goal = details.body.data.goals.find((item: { id: string }) => item.id === goalId);
    expect(goal).toMatchObject({ currentValue: 110, percentage: 100, state: 'COMPLETED' });
    expect(goal.completedAt).not.toBeNull();
    expect(goal.contributions.map((item: { value: number }) => item.value)).toEqual([70, 40]);

    await request(app)
      .delete(`/api/v1/clubs/${club.id}/goals/${goalId}`)
      .set(...bearer(owner.token))
      .expect(204);
  });

  it('controla saída, remoção e exclusão do clube', async () => {
    const club = await createClub();
    await request(app)
      .post('/api/v1/clubs/join')
      .set(...bearer(friend.token))
      .send({ inviteCode: club.inviteCode })
      .expect(200);

    await request(app)
      .delete(`/api/v1/clubs/${club.id}/members/${owner.userId}`)
      .set(...bearer(owner.token))
      .expect(400);
    await request(app)
      .delete(`/api/v1/clubs/${club.id}`)
      .set(...bearer(friend.token))
      .expect(403);
    await request(app)
      .delete(`/api/v1/clubs/${club.id}/members/${friend.userId}`)
      .set(...bearer(friend.token))
      .expect(204);
    await request(app)
      .get(`/api/v1/clubs/${club.id}`)
      .set(...bearer(friend.token))
      .expect(404);
    await request(app)
      .delete(`/api/v1/clubs/${club.id}`)
      .set(...bearer(owner.token))
      .expect(204);
  });
});
