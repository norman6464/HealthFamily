import express from 'express';
import cors from 'cors';
import { membersRouter } from './functions/members/router.js';
import { medicationsRouter } from './functions/medications/router.js';
import { schedulesRouter } from './functions/schedules/router.js';
import { recordsRouter } from './functions/records/router.js';
import { hospitalsRouter } from './functions/hospitals/router.js';
import { appointmentsRouter } from './functions/appointments/router.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ヘルスチェック
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'HealthFamily API' });
});

// ルーター登録
app.use('/members', membersRouter);
app.use('/medications', medicationsRouter);
app.use('/schedules', schedulesRouter);
app.use('/records', recordsRouter);
app.use('/hospitals', hospitalsRouter);
app.use('/appointments', appointmentsRouter);

app.listen(PORT, () => {
  console.log(`HealthFamily API サーバー起動: http://localhost:${PORT}`);
});

export default app;
