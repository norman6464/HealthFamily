import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { recordsRouter } from '../router.js';

const mockSend = vi.fn();
vi.mock('../../../shared/dynamodb.js', () => ({
  docClient: { send: (...args: unknown[]) => mockSend(...args) },
  TABLE_NAMES: {
    MEDICATION_RECORDS: 'test-records',
  },
}));

vi.mock('../../../shared/auth.js', () => ({
  getUserId: (req: { headers: Record<string, string> }) => req.headers['x-user-id'] || '',
  getUserEmail: (req: { headers: Record<string, string> }) => req.headers['x-user-email'] || '',
  requireAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const app = express();
app.use(express.json());
app.use('/records', recordsRouter);

const USER_ID = 'test-user-123';

describe('records router', () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  describe('POST /', () => {
    it('服薬記録を登録する', async () => {
      mockSend.mockResolvedValueOnce({});

      const res = await request(app)
        .post('/records')
        .set('x-user-id', USER_ID)
        .send({ memberId: 'mem-1', medicationId: 'med-1', notes: 'メモ' });

      expect(res.status).toBe(201);
      expect(res.body.data.memberId).toBe('mem-1');
      expect(res.body.data.medicationId).toBe('med-1');
      expect(res.body.data.userId).toBe(USER_ID);
      expect(res.body.data.recordId).toBeDefined();
      expect(res.body.data.takenAt).toBeDefined();
    });

    it('許可されていないフィールドを無視する', async () => {
      mockSend.mockResolvedValueOnce({});

      const res = await request(app)
        .post('/records')
        .set('x-user-id', USER_ID)
        .send({ memberId: 'mem-1', medicationId: 'med-1', userId: 'hacker', isAdmin: true });

      expect(res.body.data.userId).toBe(USER_ID);
      expect(res.body.data.isAdmin).toBeUndefined();
    });

    it('必須フィールドが不足している場合は400を返す', async () => {
      const res = await request(app)
        .post('/records')
        .set('x-user-id', USER_ID)
        .send({ memberId: 'mem-1' });

      expect(res.status).toBe(400);
    });

    it('エラー時に500を返す', async () => {
      mockSend.mockRejectedValueOnce(new Error('DB error'));

      const res = await request(app)
        .post('/records')
        .set('x-user-id', USER_ID)
        .send({ memberId: 'mem-1', medicationId: 'med-1' });

      expect(res.status).toBe(500);
    });
  });

  describe('GET /', () => {
    it('服薬記録一覧を取得する', async () => {
      const items = [{ recordId: '1', memberId: 'mem-1' }];
      mockSend.mockResolvedValueOnce({ Items: items });

      const res = await request(app)
        .get('/records')
        .set('x-user-id', USER_ID);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(items);
    });

    it('Itemsがnullの場合は空配列を返す', async () => {
      mockSend.mockResolvedValueOnce({ Items: null });

      const res = await request(app)
        .get('/records')
        .set('x-user-id', USER_ID);

      expect(res.body.data).toEqual([]);
    });
  });

  describe('GET /member/:memberId', () => {
    it('メンバー別服薬記録を取得する', async () => {
      const items = [{ recordId: '1', memberId: 'mem-1' }];
      mockSend.mockResolvedValueOnce({ Items: items });

      const res = await request(app)
        .get('/records/member/mem-1')
        .set('x-user-id', USER_ID);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(items);
    });

    it('エラー時に500を返す', async () => {
      mockSend.mockRejectedValueOnce(new Error('DB error'));

      const res = await request(app)
        .get('/records/member/mem-1')
        .set('x-user-id', USER_ID);

      expect(res.status).toBe(500);
    });
  });
});
