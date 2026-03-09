import { Request, Response } from 'express';
import fs from 'fs';
import { closeDb, getDbPath, initDb } from '../db/connection';
import { runMigrations } from '../db/migrate';

export const dbController = {
  reset(_req: Request, res: Response) {
    try {
      const dbPath = getDbPath();
      const walPath = dbPath + '-wal';
      const shmPath = dbPath + '-shm';

      closeDb();

      if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
      if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
      if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

      initDb();
      runMigrations();

      res.json({ success: true, message: 'Database reset complete' });
    } catch (error) {
      console.error('Database reset failed:', error);
      res.status(500).json({ error: 'Failed to reset database' });
    }
  },
};
