import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';
import { membersRouter } from './functions/members/router.js';
import { medicationsRouter } from './functions/medications/router.js';
import { schedulesRouter } from './functions/schedules/router.js';
import { recordsRouter } from './functions/records/router.js';
import { hospitalsRouter } from './functions/hospitals/router.js';
import { appointmentsRouter } from './functions/appointments/router.js';
import { usersRouter } from './functions/users/router.js';
import { requireAuth } from './shared/auth.js';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token'],
}));

app.use(express.json({ limit: '1mb' }));

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'HealthFamily API' });
});

app.use('/members', requireAuth, membersRouter);
app.use('/medications', requireAuth, medicationsRouter);
app.use('/schedules', requireAuth, schedulesRouter);
app.use('/records', requireAuth, recordsRouter);
app.use('/hospitals', requireAuth, hospitalsRouter);
app.use('/appointments', requireAuth, appointmentsRouter);
app.use('/users', requireAuth, usersRouter);

export const handler = serverless(app);
