import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import { bearer, buildTestApp, registerUser, type TestUser } from '../helpers';

describe('Conversas', () => {
  let app: Express;
  let ana: TestUser;
  let bruno: TestUser;
  let carla: TestUser;

  const follow = (from: TestUser, to: TestUser) =>
    request(app)
      .post(`/api/v1/users/${to.userId}/follow`)
      .set(...bearer(from.token))
      .expect(200);

  const openDirect = (from: TestUser, to: TestUser) =>
    request(app)
      .post('/api/v1/conversations/direct')
      .set(...bearer(from.token))
      .send({ userId: to.userId });

  beforeEach(async () => {
    app = buildTestApp();
    ana = await registerUser(app, 'Ana');
    bruno = await registerUser(app, 'Bruno');
    carla = await registerUser(app, 'Carla');
  });

  it('só permite conversa direta entre amigos e reaproveita a conversa existente', async () => {
    await follow(ana, bruno);
    await openDirect(ana, bruno).expect(403);
    await follow(bruno, ana);

    const first = await openDirect(ana, bruno).expect(200);
    const second = await openDirect(bruno, ana).expect(200);
    expect(second.body.data.id).toBe(first.body.data.id);
    expect(first.body.data.type).toBe('DIRECT');
    await openDirect(ana, ana).expect(400);
  });

  it('envia mensagens, conta não lidas e marca como lidas', async () => {
    await follow(ana, bruno);
    await follow(bruno, ana);
    const conversation = (await openDirect(ana, bruno).expect(200)).body.data;

    await request(app)
      .post(`/api/v1/conversations/${conversation.id}/messages`)
      .set(...bearer(ana.token))
      .send({ body: 'Terminei o capítulo 3!' })
      .expect(201);
    await request(app)
      .post(`/api/v1/conversations/${conversation.id}/messages`)
      .set(...bearer(ana.token))
      .send({ body: '' })
      .expect(400);

    const brunoList = await request(app)
      .get('/api/v1/conversations')
      .set(...bearer(bruno.token))
      .expect(200);
    expect(brunoList.body.data[0]).toMatchObject({
      unreadCount: 1,
      lastMessage: { body: 'Terminei o capítulo 3!' },
    });

    const messages = await request(app)
      .get(`/api/v1/conversations/${conversation.id}/messages`)
      .set(...bearer(bruno.token))
      .expect(200);
    expect(messages.body.data[0].sender.id).toBe(ana.userId);

    await request(app)
      .post(`/api/v1/conversations/${conversation.id}/read`)
      .set(...bearer(bruno.token))
      .expect(204);
    const afterRead = await request(app)
      .get('/api/v1/conversations')
      .set(...bearer(bruno.token))
      .expect(200);
    expect(afterRead.body.data[0].unreadCount).toBe(0);
  });

  it('impede acesso de quem não participa da conversa', async () => {
    await follow(ana, bruno);
    await follow(bruno, ana);
    const conversation = (await openDirect(ana, bruno).expect(200)).body.data;

    await request(app)
      .get(`/api/v1/conversations/${conversation.id}/messages`)
      .set(...bearer(carla.token))
      .expect(404);
    await request(app)
      .post(`/api/v1/conversations/${conversation.id}/messages`)
      .set(...bearer(carla.token))
      .send({ body: 'Oi' })
      .expect(404);
  });

  it('inclui membros novos na conversa do clube', async () => {
    const club = (
      await request(app)
        .post('/api/v1/clubs')
        .set(...bearer(ana.token))
        .send({ name: 'Leituras de domingo' })
        .expect(201)
    ).body.data;
    await request(app)
      .post('/api/v1/clubs/join')
      .set(...bearer(carla.token))
      .send({ inviteCode: club.inviteCode })
      .expect(200);

    await request(app)
      .post(`/api/v1/conversations/${club.conversationId}/messages`)
      .set(...bearer(carla.token))
      .send({ body: 'Cheguei!' })
      .expect(201);
    const list = await request(app)
      .get('/api/v1/conversations')
      .set(...bearer(ana.token))
      .expect(200);
    expect(list.body.data[0]).toMatchObject({
      type: 'CLUB',
      club: { name: 'Leituras de domingo' },
    });
  });
});
