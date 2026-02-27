import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { schedulesRouter } from '../router.js';

const mockSend = vi.fn();
vi.mock('../../../shared/dynamodb.js', () => ({
  docClient: { send: (...args: unknown[]) => mockSend(...args) },
  TABLE_NAMES: {
    SCHEDULES: 'test-schedules',
  },
}));

vi.mock('../../../shared/auth.js', () => ({
  getUserId: (req: { headers: Record<string, string> }) => req.headers['x-user-id'] || '',
  getUserEmail: (req: { headers: Record<string, string> }) => req.headers['x-user-email'] || '',
  requireAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const app = express();
app.use(express.json());
app.use('/schedules', schedulesRouter);

const USER_ID = 'test-user-123';

describe('schedules router', () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  describe('GET /', () => {
    it('スケジュール一覧を取得する', async () => {
      const items = [{ scheduleId: '1', scheduledTime: '08:00' }];
      mockSend.mockResolvedValueOnce({ Items: items });

      const res = await request(app)
        .get('/schedules')
        .set('x-user-id', USER_ID);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(items);
    });

    it('Itemsがnullの場合は空配列を返す', async () => {
      mockSend.mockResolvedValueOnce({ Items: null });

      const res = await request(app)
        .get('/schedules')
        .set('x-user-id', USER_ID);

      expect(res.body.data).toEqual([]);
    });

    it('エラー時に500を返す', async () => {
      mockSend.mockRejectedValueOnce(new Error('DB error'));

      const res = await request(app)
        .get('/schedules')
        .set('x-user-id', USER_ID);

      expect(res.status).toBe(500);
    });
  });

  describe('POST /', () => {
    it('スケジュールを登録する', async () => {
      mockSend.mockResolvedValueOnce({});

      const res = await request(app)
        .post('/schedules')
        .set('x-user-id', USER_ID)
        .send({
          medicationId: 'med-1',
          memberId: 'mem-1',
          scheduledTime: '08:00',
          daysOfWeek: ['mon', 'wed', 'fri'],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.scheduledTime).toBe('08:00');
      expect(res.body.data.isEnabled).toBe(true);
      expect(res.body.data.reminderMinutesBefore).toBe(5);
      expect(res.body.data.userId).toBe(USER_ID);
    });

    it('必須フィールドが不足している場合は400を返す', async () => {
      const res = await request(app)
        .post('/schedules')
        .set('x-user-id', USER_ID)
        .send({ scheduledTime: '08:00' });

      expect(res.status).toBe(400);
    });

    it('エラー時に500を返す', async () => {
      mockSend.mockRejectedValueOnce(new Error('DB error'));

      const res = await request(app)
        .post('/schedules')
        .set('x-user-id', USER_ID)
        .send({ medicationId: 'med-1', memberId: 'mem-1', scheduledTime: '08:00' });

      expect(res.status).toBe(500);
    });
  });

  describe('PUT /:scheduleId', () => {
    it('スケジュールを更新する', async () => {
      mockSend
        .mockResolvedValueOnce({ Item: { scheduleId: 'sch-1', userId: USER_ID } })
        .mockResolvedValueOnce({ Attributes: { scheduleId: 'sch-1', scheduledTime: '09:00' } });

      const res = await request(app)
        .put('/schedules/sch-1')
        .set('x-user-id', USER_ID)
        .send({
          scheduledTime: '09:00',
          daysOfWeek: ['tue'],
          isEnabled: false,
          reminderMinutesBefore: 10,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.scheduledTime).toBe('09:00');
    });

    it('他ユーザーのスケジュールは更新できない', async () => {
      mockSend.mockResolvedValueOnce({
        Item: { scheduleId: 'sch-1', userId: 'other-user' },
      });

      const res = await request(app)
        .put('/schedules/sch-1')
        .set('x-user-id', USER_ID)
        .send({ scheduledTime: '09:00' });

      expect(res.status).toBe(404);
    });

    it('存在しないスケジュールは404を返す', async () => {
      mockSend.mockResolvedValueOnce({ Item: undefined });

      const res = await request(app)
        .put('/schedules/not-found')
        .set('x-user-id', USER_ID)
        .send({ scheduledTime: '09:00' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /:scheduleId', () => {
    it('スケジュールを削除する', async () => {
      mockSend
        .mockResolvedValueOnce({ Item: { scheduleId: 'sch-1', userId: USER_ID } })
        .mockResolvedValueOnce({});

      const res = await request(app)
        .delete('/schedules/sch-1')
        .set('x-user-id', USER_ID);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('削除しました');
    });

    it('他ユーザーのスケジュールは削除できない', async () => {
      mockSend.mockResolvedValueOnce({
        Item: { scheduleId: 'sch-1', userId: 'other-user' },
      });

      const res = await request(app)
        .delete('/schedules/sch-1')
        .set('x-user-id', USER_ID);

      expect(res.status).toBe(404);
    });
  });
});
