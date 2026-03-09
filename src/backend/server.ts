import express from 'express';
import { healthRouter } from './routes/health.routes';
import { missionRouter } from './routes/mission.routes';
import { objectivesRouter } from './routes/objectives.routes';
import { plansRouter } from './routes/plans.routes';
import { tasksRouter } from './routes/tasks.routes';
import { settingsRouter } from './routes/settings.routes';
import { projectsRouter } from './routes/projects.routes';

const app = express();

app.use(express.json());

app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
  if (_req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

app.use('/api', healthRouter);
app.use('/api', missionRouter);
app.use('/api', objectivesRouter);
app.use('/api', plansRouter);
app.use('/api', tasksRouter);
app.use('/api', settingsRouter);
app.use('/api', projectsRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = err instanceof Error ? err.message : 'Internal server error';
  console.error('[Matrix API Error]', message);
  res.status(500).json({ error: message });
});

export { app as expressApp };
