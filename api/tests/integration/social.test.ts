import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import { bearer, buildTestApp, createLibraryItem, registerUser, type TestUser } from '../helpers';

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

describe('Perfis e seguidores', () => {
  let app: Express;
  let ana: TestUser;
  let bruno: TestUser;

  beforeEach(async () => {
    app = buildTestApp();
    ana = await registerUser(app, 'Ana Beatriz');
    bruno = await registerUser(app, 'Bruno Lima');
  });

  it('gera nome de usuário e permite editar o perfil', async () => {
    const me = await request(app)
      .get('/api/v1/auth/me')
      .set(...bearer(ana.token))
      .expect(200);
    expect(me.body.user.username).toMatch(/^anabeatriz/);
    expect(me.body.user.shareActivity).toBe(true);

    const updated = await request(app)
      .patch('/api/v1/users/me')
      .set(...bearer(ana.token))
      .send({ username: `ana.${Date.now()}`, bio: 'Leio de tudo um pouco.' })
      .expect(200);
    expect(updated.body.data.bio).toBe('Leio de tudo um pouco.');

    await request(app)
      .patch('/api/v1/users/me')
      .set(...bearer(bruno.token))
      .send({ username: updated.body.data.username })
      .expect(409);
    await request(app)
      .patch('/api/v1/users/me')
      .set(...bearer(bruno.token))
      .send({ username: 'Nome Inválido!' })
      .expect(400);
  });

  it('pesquisa pessoas por nome sem incluir o próprio usuário', async () => {
    const response = await request(app)
      .get('/api/v1/users/search?q=bruno')
      .set(...bearer(ana.token))
      .expect(200);
    const ids = response.body.data.map((user: { id: string }) => user.id);
    expect(ids).toContain(bruno.userId);
    expect(ids).not.toContain(ana.userId);
    await request(app)
      .get('/api/v1/users/search?q=b')
      .set(...bearer(ana.token))
      .expect(400);
  });

  it('segue, vira amizade quando é recíproco e deixa de seguir', async () => {
    await request(app)
      .post(`/api/v1/users/${ana.userId}/follow`)
      .set(...bearer(ana.token))
      .expect(400);

    const following = await request(app)
      .post(`/api/v1/users/${bruno.userId}/follow`)
      .set(...bearer(ana.token))
      .expect(200);
    expect(following.body.data).toMatchObject({ isFollowing: true, isFriend: false });

    await request(app)
      .post(`/api/v1/users/${ana.userId}/follow`)
      .set(...bearer(bruno.token))
      .expect(200);
    const profile = await request(app)
      .get(`/api/v1/users/${bruno.userId}`)
      .set(...bearer(ana.token))
      .expect(200);
    expect(profile.body.data.relationship).toMatchObject({ isFriend: true, followsYou: true });
    expect(profile.body.data.stats).toMatchObject({ followers: 1, following: 1 });

    const friends = await request(app)
      .get('/api/v1/users/me/friends')
      .set(...bearer(ana.token))
      .expect(200);
    expect(friends.body.data.map((user: { id: string }) => user.id)).toEqual([bruno.userId]);

    await request(app)
      .delete(`/api/v1/users/${bruno.userId}/follow`)
      .set(...bearer(ana.token))
      .expect(200);
    const followers = await request(app)
      .get(`/api/v1/users/${bruno.userId}/followers`)
      .set(...bearer(ana.token))
      .expect(200);
    expect(followers.body.data).toHaveLength(0);
  });

  it('mostra estantes e livros em leitura no perfil', async () => {
    await createLibraryItem(app, bruno.token, {
      title: 'Ensaio sobre a Cegueira',
      currentPage: 30,
    });
    await createLibraryItem(app, bruno.token, {
      title: 'Memorial do Convento',
      status: 'FINISHED',
    });
    const profile = await request(app)
      .get(`/api/v1/users/${bruno.userId}`)
      .set(...bearer(ana.token))
      .expect(200);
    expect(profile.body.data.shelves).toMatchObject({ READING: 1, FINISHED: 1 });
    expect(profile.body.data.currentlyReading[0].book.title).toBe('Ensaio sobre a Cegueira');
    expect(profile.body.data.user.email).toBeUndefined();
  });
});

describe('Feed', () => {
  let app: Express;
  let ana: TestUser;
  let bruno: TestUser;

  beforeEach(async () => {
    app = buildTestApp();
    ana = await registerUser(app, 'Ana');
    bruno = await registerUser(app, 'Bruno');
    await befriend(app, ana, bruno);
  });

  const feedOf = async (user: TestUser) =>
    (
      await request(app)
        .get('/api/v1/feed')
        .set(...bearer(user.token))
        .expect(200)
    ).body.data;

  it('publica livros concluídos e resenhas de quem você segue', async () => {
    const item = await createLibraryItem(app, bruno.token, { title: 'Torto Arado' });
    await request(app)
      .patch(`/api/v1/library/${item.id}`)
      .set(...bearer(bruno.token))
      .send({ status: 'FINISHED', rating: 5, review: 'Potente e necessário.' })
      .expect(200);

    const feed = await feedOf(ana);
    const finished = feed.find((entry: { type: string }) => entry.type === 'BOOK_FINISHED');
    const review = feed.find((entry: { type: string }) => entry.type === 'REVIEW_POSTED');
    expect(finished.book).toMatchObject({ title: 'Torto Arado', rating: 5 });
    expect(review.book.review).toBe('Potente e necessário.');
    expect(review.user.id).toBe(bruno.userId);
    expect(feed.some((entry: { type: string }) => entry.type === 'ACHIEVEMENT_UNLOCKED')).toBe(
      true,
    );
  });

  it('não publica atividades de quem desativou o compartilhamento', async () => {
    await request(app)
      .patch('/api/v1/users/me')
      .set(...bearer(bruno.token))
      .send({ shareActivity: false })
      .expect(200);
    const before = (await feedOf(ana)).length;
    await createLibraryItem(app, bruno.token, { status: 'FINISHED', review: 'Gostei.' });
    const feed = await feedOf(ana);
    expect(feed).toHaveLength(before);
    expect(feed.some((entry: { type: string }) => entry.type === 'REVIEW_POSTED')).toBe(false);
  });

  it('curte, comenta e controla a exclusão de comentários', async () => {
    await createLibraryItem(app, bruno.token, { status: 'FINISHED' });
    const [activity] = await feedOf(ana);
    const carla = await registerUser(app, 'Carla');

    const liked = await request(app)
      .post(`/api/v1/activities/${activity.id}/likes`)
      .set(...bearer(ana.token))
      .expect(200);
    expect(liked.body.data).toMatchObject({ likeCount: 1, likedByMe: true });
    await request(app)
      .post(`/api/v1/activities/${activity.id}/likes`)
      .set(...bearer(ana.token))
      .expect(200);
    const unliked = await request(app)
      .delete(`/api/v1/activities/${activity.id}/likes`)
      .set(...bearer(ana.token))
      .expect(200);
    expect(unliked.body.data).toMatchObject({ likeCount: 0, likedByMe: false });

    const comment = await request(app)
      .post(`/api/v1/activities/${activity.id}/comments`)
      .set(...bearer(ana.token))
      .send({ body: 'Parabéns pela leitura!' })
      .expect(201);
    await request(app)
      .post(`/api/v1/activities/${activity.id}/comments`)
      .set(...bearer(ana.token))
      .send({ body: '   ' })
      .expect(400);

    const comments = await request(app)
      .get(`/api/v1/activities/${activity.id}/comments`)
      .set(...bearer(bruno.token))
      .expect(200);
    expect(comments.body.data[0]).toMatchObject({ body: 'Parabéns pela leitura!' });

    await request(app)
      .delete(`/api/v1/activities/${activity.id}/comments/${comment.body.data.id}`)
      .set(...bearer(carla.token))
      .expect(403);
    await request(app)
      .delete(`/api/v1/activities/${activity.id}/comments/${comment.body.data.id}`)
      .set(...bearer(bruno.token))
      .expect(204);
  });

  it('não mostra no feed atividades de quem você não segue', async () => {
    const stranger = await registerUser(app, 'Desconhecida');
    await createLibraryItem(app, stranger.token, { status: 'FINISHED' });
    const feed = await feedOf(ana);
    expect(feed.some((entry: { user: { id: string } }) => entry.user.id === stranger.userId)).toBe(
      false,
    );
  });
});
