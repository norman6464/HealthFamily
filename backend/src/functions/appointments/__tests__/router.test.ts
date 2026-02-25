import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { appointmentsRouter } from '../router.js';

const mockSend = vi.fn();
vi.mock('../../../shared/dynamodb.js', () => ({
  docClient: { send: (...args: unknown[]) => mockSend(...args) },
  TABLE_NAMES: {
    APPOINTMENTS: 'test-appointments',
  },
}));

const app = express();
app.use(express.json());
app.use('/appointments', appointmentsRouter);

const USER_ID = 'test-user-123';

describe('appointments router', () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  describe('GET /', () => {
    it('予約一覧を取得する', async () => {
      const items = [{ appointmentId: '1', type: '検診' }];
      mockSend.mockResolvedValueOnce({ Items: items });

      const res = await request(app)
        .get('/appointments')
        .set('x-user-id', USER_ID);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(items);
    });

    it('エラー時に500を返す', async () => {
      mockSend.mockRejectedValueOnce(new Error('DB error'));

      const res = await request(app)
        .get('/appointments')
        .set('x-user-id', USER_ID);

      expect(res.status).toBe(500);
    });
  });

  describe('POST /', () => {
    it('予約を登録する', async () => {
      mockSend.mockResolvedValueOnce({});

      const res = await request(app)
        .post('/appointments')
        .set('x-user-id', USER_ID)
        .send({
          memberId: 'mem-1',
          hospitalId: 'hos-1',
          appointmentDate: '2026-03-01',
          type: '検診',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.memberId).toBe('mem-1');
      expect(res.body.data.reminderEnabled).toBe(true);
      expect(res.body.data.reminderDaysBefore).toBe(1);
      expect(res.body.data.userId).toBe(USER_ID);
    });

    it('必須フィールドが不足している場合は400を返す', async () => {
      const res = await request(app)
        .post('/appointments')
        .set('x-user-id', USER_ID)
        .send({ memberId: 'mem-1' });

      expect(res.status).toBe(400);
    });

    it('エラー時に500を返す', async () => {
      mockSend.mockRejectedValueOnce(new Error('DB error'));

      const res = await request(app)
        .post('/appointments')
        .set('x-user-id', USER_ID)
        .send({ memberId: 'mem-1', appointmentDate: '2026-03-01' });

      expect(res.status).toBe(500);
    });
  });

  describe('PUT /:appointmentId', () => {
    it('予約を更新する', async () => {
      mockSend
        .mockResolvedValueOnce({ Item: { appointmentId: 'apt-1', userId: USER_ID } })
        .mockResolvedValueOnce({ Attributes: { appointmentId: 'apt-1', type: '再診' } });

      const res = await request(app)
        .put('/appointments/apt-1')
        .set('x-user-id', USER_ID)
        .send({ type: '再診', notes: 'メモ' });

      expect(res.status).toBe(200);
      expect(res.body.data.type).toBe('再診');
    });

    it('他ユーザーの予約は更新できない', async () => {
      mockSend.mockResolvedValueOnce({
        Item: { appointmentId: 'apt-1', userId: 'other-user' },
      });

      const res = await request(app)
        .put('/appointments/apt-1')
        .set('x-user-id', USER_ID)
        .send({ type: '再診' });

      expect(res.status).toBe(404);
    });

    it('存在しない予約は404を返す', async () => {
      mockSend.mockResolvedValueOnce({ Item: undefined });

      const res = await request(app)
        .put('/appointments/not-found')
        .set('x-user-id', USER_ID)
        .send({ type: '再診' });

      expect(res.status).toBe(404);
    });

    it('更新フィールドがない場合は400を返す', async () => {
      mockSend.mockResolvedValueOnce({
        Item: { appointmentId: 'apt-1', userId: USER_ID },
      });

      const res = await request(app)
        .put('/appointments/apt-1')
        .set('x-user-id', USER_ID)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('更新するフィールドがありません');
    });
  });

  describe('DELETE /:appointmentId', () => {
    it('予約を削除する', async () => {
      mockSend
        .mockResolvedValueOnce({ Item: { appointmentId: 'apt-1', userId: USER_ID } })
        .mockResolvedValueOnce({});

      const res = await request(app)
        .delete('/appointments/apt-1')
        .set('x-user-id', USER_ID);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('削除しました');
    });

    it('他ユーザーの予約は削除できない', async () => {
      mockSend.mockResolvedValueOnce({
        Item: { appointmentId: 'apt-1', userId: 'other-user' },
      });

      const res = await request(app)
        .delete('/appointments/apt-1')
        .set('x-user-id', USER_ID);

      expect(res.status).toBe(404);
    });
  });
});
