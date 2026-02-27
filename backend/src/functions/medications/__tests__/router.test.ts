import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { medicationsRouter } from '../router.js';

const mockSend = vi.fn();
vi.mock('../../../shared/dynamodb.js', () => ({
  docClient: { send: (...args: unknown[]) => mockSend(...args) },
  TABLE_NAMES: {
    MEDICATIONS: 'test-medications',
  },
}));

vi.mock('../../../shared/auth.js', () => ({
  getUserId: (req: { headers: Record<string, string> }) => req.headers['x-user-id'] || '',
  getUserEmail: (req: { headers: Record<string, string> }) => req.headers['x-user-email'] || '',
  requireAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const app = express();
app.use(express.json());
app.use('/medications', medicationsRouter);

const USER_ID = 'test-user-123';

describe('medications router', () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  describe('GET /member/:memberId', () => {
    it('メンバーのお薬一覧を取得する', async () => {
      const items = [{ medicationId: '1', name: '薬A' }];
      mockSend.mockResolvedValueOnce({ Items: items });

      const res = await request(app)
        .get('/medications/member/mem-1')
        .set('x-user-id', USER_ID);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(items);
    });

    it('Itemsがnullの場合は空配列を返す', async () => {
      mockSend.mockResolvedValueOnce({ Items: null });

      const res = await request(app)
        .get('/medications/member/mem-1')
        .set('x-user-id', USER_ID);

      expect(res.body.data).toEqual([]);
    });
  });

  describe('POST /', () => {
    it('お薬を登録する', async () => {
      mockSend.mockResolvedValueOnce({});

      const res = await request(app)
        .post('/medications')
        .set('x-user-id', USER_ID)
        .send({ name: '薬A', memberId: 'mem-1', category: '内服薬' });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('薬A');
      expect(res.body.data.isActive).toBe(true);
      expect(res.body.data.userId).toBe(USER_ID);
    });

    it('薬の名前が空の場合は400を返す', async () => {
      const res = await request(app)
        .post('/medications')
        .set('x-user-id', USER_ID)
        .send({ memberId: 'mem-1' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('薬の名前は必須です');
    });
  });

  describe('GET /:medicationId', () => {
    it('お薬詳細を取得する', async () => {
      mockSend.mockResolvedValueOnce({
        Item: { medicationId: 'med-1', userId: USER_ID, name: '薬A' },
      });

      const res = await request(app)
        .get('/medications/med-1')
        .set('x-user-id', USER_ID);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('薬A');
    });

    it('存在しないお薬は404を返す', async () => {
      mockSend.mockResolvedValueOnce({ Item: undefined });

      const res = await request(app)
        .get('/medications/not-found')
        .set('x-user-id', USER_ID);

      expect(res.status).toBe(404);
    });

    it('他ユーザーのお薬は404を返す', async () => {
      mockSend.mockResolvedValueOnce({
        Item: { medicationId: 'med-1', userId: 'other-user' },
      });

      const res = await request(app)
        .get('/medications/med-1')
        .set('x-user-id', USER_ID);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /:medicationId/stock', () => {
    it('在庫数を更新する', async () => {
      mockSend
        .mockResolvedValueOnce({ Item: { medicationId: 'med-1', userId: USER_ID } })
        .mockResolvedValueOnce({ Attributes: { medicationId: 'med-1', stockQuantity: 10 } });

      const res = await request(app)
        .put('/medications/med-1/stock')
        .set('x-user-id', USER_ID)
        .send({ stockQuantity: 10 });

      expect(res.status).toBe(200);
      expect(res.body.data.stockQuantity).toBe(10);
    });

    it('在庫数が負の値の場合は400を返す', async () => {
      const res = await request(app)
        .put('/medications/med-1/stock')
        .set('x-user-id', USER_ID)
        .send({ stockQuantity: -1 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('在庫数は0以上の数値を指定してください');
    });

    it('在庫数が数値でない場合は400を返す', async () => {
      const res = await request(app)
        .put('/medications/med-1/stock')
        .set('x-user-id', USER_ID)
        .send({ stockQuantity: 'abc' });

      expect(res.status).toBe(400);
    });

    it('他ユーザーのお薬の在庫は更新できない', async () => {
      mockSend.mockResolvedValueOnce({
        Item: { medicationId: 'med-1', userId: 'other-user' },
      });

      const res = await request(app)
        .put('/medications/med-1/stock')
        .set('x-user-id', USER_ID)
        .send({ stockQuantity: 10 });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /:medicationId', () => {
    it('お薬を削除する', async () => {
      mockSend
        .mockResolvedValueOnce({ Item: { medicationId: 'med-1', userId: USER_ID } })
        .mockResolvedValueOnce({});

      const res = await request(app)
        .delete('/medications/med-1')
        .set('x-user-id', USER_ID);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('削除しました');
    });

    it('他ユーザーのお薬は削除できない', async () => {
      mockSend.mockResolvedValueOnce({
        Item: { medicationId: 'med-1', userId: 'other-user' },
      });

      const res = await request(app)
        .delete('/medications/med-1')
        .set('x-user-id', USER_ID);

      expect(res.status).toBe(404);
    });
  });
});
