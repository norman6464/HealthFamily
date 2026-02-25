import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { membersRouter } from '../router.js';

// DynamoDB モック
const mockSend = vi.fn();
vi.mock('../../../shared/dynamodb.js', () => ({
  docClient: { send: (...args: unknown[]) => mockSend(...args) },
  TABLE_NAMES: {
    MEMBERS: 'test-members',
  },
}));

const app = express();
app.use(express.json());
app.use('/members', membersRouter);

const USER_ID = 'test-user-123';

describe('members router', () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  describe('GET /', () => {
    it('メンバー一覧を取得する', async () => {
      const items = [{ memberId: '1', name: '太郎' }];
      mockSend.mockResolvedValueOnce({ Items: items });

      const res = await request(app)
        .get('/members')
        .set('x-user-id', USER_ID);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(items);
    });

    it('Itemsがnullの場合は空配列を返す', async () => {
      mockSend.mockResolvedValueOnce({ Items: null });

      const res = await request(app)
        .get('/members')
        .set('x-user-id', USER_ID);

      expect(res.body.data).toEqual([]);
    });

    it('エラー時に500を返す', async () => {
      mockSend.mockRejectedValueOnce(new Error('DB error'));

      const res = await request(app)
        .get('/members')
        .set('x-user-id', USER_ID);

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /', () => {
    it('メンバーを登録する', async () => {
      mockSend.mockResolvedValueOnce({});

      const res = await request(app)
        .post('/members')
        .set('x-user-id', USER_ID)
        .send({ name: '太郎', memberType: 'human' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('太郎');
      expect(res.body.data.userId).toBe(USER_ID);
      expect(res.body.data.memberId).toBeDefined();
    });

    it('名前が空の場合は400を返す', async () => {
      const res = await request(app)
        .post('/members')
        .set('x-user-id', USER_ID)
        .send({ name: '' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('名前は必須です');
    });

    it('名前がない場合は400を返す', async () => {
      const res = await request(app)
        .post('/members')
        .set('x-user-id', USER_ID)
        .send({ memberType: 'human' });

      expect(res.status).toBe(400);
    });

    it('許可されていないフィールドを無視する', async () => {
      mockSend.mockResolvedValueOnce({});

      const res = await request(app)
        .post('/members')
        .set('x-user-id', USER_ID)
        .send({ name: '太郎', __proto__: { admin: true }, userId: 'hacker' });

      expect(res.body.data.userId).toBe(USER_ID);
      expect(res.body.data.admin).toBeUndefined();
    });
  });

  describe('GET /:memberId', () => {
    it('メンバー詳細を取得する', async () => {
      mockSend.mockResolvedValueOnce({
        Item: { memberId: 'mem-1', userId: USER_ID, name: '太郎' },
      });

      const res = await request(app)
        .get('/members/mem-1')
        .set('x-user-id', USER_ID);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('太郎');
    });

    it('存在しないメンバーは404を返す', async () => {
      mockSend.mockResolvedValueOnce({ Item: undefined });

      const res = await request(app)
        .get('/members/not-found')
        .set('x-user-id', USER_ID);

      expect(res.status).toBe(404);
    });

    it('他ユーザーのメンバーは404を返す', async () => {
      mockSend.mockResolvedValueOnce({
        Item: { memberId: 'mem-1', userId: 'other-user', name: '太郎' },
      });

      const res = await request(app)
        .get('/members/mem-1')
        .set('x-user-id', USER_ID);

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /:memberId', () => {
    it('メンバーを削除する', async () => {
      mockSend
        .mockResolvedValueOnce({ Item: { memberId: 'mem-1', userId: USER_ID } })
        .mockResolvedValueOnce({});

      const res = await request(app)
        .delete('/members/mem-1')
        .set('x-user-id', USER_ID);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('削除しました');
    });

    it('他ユーザーのメンバーは削除できない', async () => {
      mockSend.mockResolvedValueOnce({
        Item: { memberId: 'mem-1', userId: 'other-user' },
      });

      const res = await request(app)
        .delete('/members/mem-1')
        .set('x-user-id', USER_ID);

      expect(res.status).toBe(404);
    });

    it('存在しないメンバーは404を返す', async () => {
      mockSend.mockResolvedValueOnce({ Item: undefined });

      const res = await request(app)
        .delete('/members/not-found')
        .set('x-user-id', USER_ID);

      expect(res.status).toBe(404);
    });
  });
});
