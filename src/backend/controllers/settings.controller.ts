import { Request, Response } from 'express';
import { z } from 'zod';
import { settingsRepo } from '../repositories/settings.repository';

const upsertSchema = z.object({
  value: z.string(),
});

export const settingsController = {
  getAll(_req: Request, res: Response) {
    res.json(settingsRepo.findAll());
  },

  getByKey(req: Request, res: Response) {
    const s = settingsRepo.findByKey(req.params.key);
    if (!s) return res.status(404).json({ error: 'Setting not found' });
    res.json(s);
  },

  upsert(req: Request, res: Response) {
    const parsed = upsertSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    const s = settingsRepo.upsert(req.params.key, parsed.data.value);
    res.json(s);
  },
};
