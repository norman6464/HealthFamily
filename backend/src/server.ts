import express from 'express';
import cors from 'cors';
import { membersRouter } from './functions/members/router.js';
import { medicationsRouter } from './functions/medications/router.js';
import { schedulesRouter } from './functions/schedules/router.js';
import { recordsRouter } from './functions/records/router.js';
import { hospitalsRouter } from './functions/hospitals/router.js';
import { appointmentsRouter } from './functions/appointments/router.js';
import { requireAuth } from './shared/auth.js';
import { env } from './shared/env.js';

const app = express();
const PORT = env.PORT;

// CORS設定（許可オリジンを制限）
const allowedOrigins = env.ALLOWED_ORIGINS.split(',');
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-user-id'],
}));

// リクエストボディサイズ制限（DoS防止）
app.use(express.json({ limit: '1mb' }));

// セキュリティヘッダー
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// ヘルスチェック（認証不要）
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'HealthFamily API' });
});

// 認証ミドルウェア（全APIルートに適用）
app.use('/members', requireAuth, membersRouter);
app.use('/medications', requireAuth, medicationsRouter);
app.use('/schedules', requireAuth, schedulesRouter);
app.use('/records', requireAuth, recordsRouter);
app.use('/hospitals', requireAuth, hospitalsRouter);
app.use('/appointments', requireAuth, appointmentsRouter);

app.listen(PORT, () => {
  console.log(`HealthFamily API サーバー起動: http://localhost:${PORT}`);
});

export default app;
