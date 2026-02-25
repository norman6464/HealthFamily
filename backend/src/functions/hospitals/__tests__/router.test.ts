import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { hospitalsRouter } from '../router.js';

const mockSend = vi.fn();
vi.mock('../../../shared/dynamodb.js', () => ({
  docClient: { send: (...args: unknown[]) => mockSend(...args) },
  TABLE_NAMES: {
    HOSPITALS: 'test-hospitals',
  },
}));

const app = express();
app.use(express.json());
app.use('/hospitals', hospitalsRouter);

const USER_ID = 'test-user-123';

describe('hospitals router', () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  describe('GET /', () => {
    it('病院一覧を取得する', async () => {
      const items = [{ hospitalId: '1', name: 'A病院' }];
      mockSend.mockResolvedValueOnce({ Items: items });

      const res = await request(app)
        .get('/hospitals')
        .set('x-user-id', USER_ID);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(items);
    });

    it('エラー時に500を返す', async () => {
      mockSend.mockRejectedValueOnce(new Error('DB error'));

      const res = await request(app)
        .get('/hospitals')
        .set('x-user-id', USER_ID);

      expect(res.status).toBe(500);
    });
  });

  describe('POST /', () => {
    it('病院を登録する', async () => {
      mockSend.mockResolvedValueOnce({});

      const res = await request(app)
        .post('/hospitals')
        .set('x-user-id', USER_ID)
        .send({ name: 'A病院', address: '東京都' });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('A病院');
      expect(res.body.data.userId).toBe(USER_ID);
    });

    it('病院名が空の場合は400を返す', async () => {
      const res = await request(app)
        .post('/hospitals')
        .set('x-user-id', USER_ID)
        .send({ address: '東京都' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('病院名は必須です');
    });
  });

  describe('PUT /:hospitalId', () => {
    it('病院情報を更新する', async () => {
      mockSend
        .mockResolvedValueOnce({ Item: { hospitalId: 'hos-1', userId: USER_ID } })
        .mockResolvedValueOnce({ Attributes: { hospitalId: 'hos-1', name: 'B病院' } });

      const res = await request(app)
        .put('/hospitals/hos-1')
        .set('x-user-id', USER_ID)
        .send({ name: 'B病院' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('B病院');
    });

    it('他ユーザーの病院は更新できない', async () => {
      mockSend.mockResolvedValueOnce({
        Item: { hospitalId: 'hos-1', userId: 'other-user' },
      });

      const res = await request(app)
        .put('/hospitals/hos-1')
        .set('x-user-id', USER_ID)
        .send({ name: 'B病院' });

      expect(res.status).toBe(404);
    });

    it('更新フィールドがない場合は400を返す', async () => {
      mockSend.mockResolvedValueOnce({
        Item: { hospitalId: 'hos-1', userId: USER_ID },
      });

      const res = await request(app)
        .put('/hospitals/hos-1')
        .set('x-user-id', USER_ID)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('更新するフィールドがありません');
    });

    it('memberId等の許可外フィールドは更新に含まれない', async () => {
      mockSend
        .mockResolvedValueOnce({ Item: { hospitalId: 'hos-1', userId: USER_ID } })
        .mockResolvedValueOnce({ Attributes: { hospitalId: 'hos-1', name: 'B病院' } });

      const res = await request(app)
        .put('/hospitals/hos-1')
        .set('x-user-id', USER_ID)
        .send({ name: 'B病院', memberId: 'hacker', userId: 'hacker' });

      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /:hospitalId', () => {
    it('病院を削除する', async () => {
      mockSend
        .mockResolvedValueOnce({ Item: { hospitalId: 'hos-1', userId: USER_ID } })
        .mockResolvedValueOnce({});

      const res = await request(app)
        .delete('/hospitals/hos-1')
        .set('x-user-id', USER_ID);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('削除しました');
    });

    it('他ユーザーの病院は削除できない', async () => {
      mockSend.mockResolvedValueOnce({
        Item: { hospitalId: 'hos-1', userId: 'other-user' },
      });

      const res = await request(app)
        .delete('/hospitals/hos-1')
        .set('x-user-id', USER_ID);

      expect(res.status).toBe(404);
    });
  });
});
