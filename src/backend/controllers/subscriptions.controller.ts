import { Request, Response } from 'express';
import { z } from 'zod';
import { subscriptionsRepo } from '../repositories/subscriptions.repository';

const createSchema = z.object({
  name: z.string().min(1),
  cycle: z.enum(['weekly', 'monthly']).optional(),
  resetDay: z.number().min(0).max(31).optional(),
  budget: z.number().min(1).max(100).optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  cycle: z.enum(['weekly', 'monthly']).optional(),
  resetDay: z.number().min(0).max(31).optional(),
  budget: z.number().min(1).max(100).optional(),
  currentUsed: z.number().min(0).max(100).optional(),
});

const usageSchema = z.object({
  currentUsed: z.number().min(0).max(100),
});

export const subscriptionsController = {
  getAll(_req: Request, res: Response) {
    res.json(subscriptionsRepo.findAll());
  },

  create(req: Request, res: Response) {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    const sub = subscriptionsRepo.create(parsed.data);
    res.status(201).json(sub);
  },

  update(req: Request, res: Response) {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    const sub = subscriptionsRepo.update(Number(req.params.id), parsed.data);
    if (!sub) return res.status(404).json({ error: 'Subscription not found' });
    res.json(sub);
  },

  delete(req: Request, res: Response) {
    const id = Number(req.params.id);
    const sub = subscriptionsRepo.findById(id);
    if (!sub) return res.status(404).json({ error: 'Subscription not found' });
    subscriptionsRepo.delete(id);
    res.status(204).send();
  },

  updateUsage(req: Request, res: Response) {
    const parsed = usageSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    const sub = subscriptionsRepo.update(Number(req.params.id), { currentUsed: parsed.data.currentUsed });
    if (!sub) return res.status(404).json({ error: 'Subscription not found' });
    res.json(sub);
  },
};
