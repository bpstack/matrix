import { Request, Response } from 'express';
import { z } from 'zod';
import { tasksRepo } from '../repositories/tasks.repository';

const createSchema = z.object({
  planId: z.number(),
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  sortOrder: z.number().optional(),
  deadline: z.string().optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  sortOrder: z.number().optional(),
  planId: z.number().optional(),
  deadline: z.string().optional(),
});

export const tasksController = {
  getAll(req: Request, res: Response) {
    const filters: { planId?: number; status?: string } = {};
    if (req.query.plan_id) filters.planId = Number(req.query.plan_id);
    if (req.query.status) filters.status = String(req.query.status);
    res.json(tasksRepo.findFiltered(filters));
  },

  getById(req: Request, res: Response) {
    const t = tasksRepo.findById(Number(req.params.id));
    if (!t) return res.status(404).json({ error: 'Task not found' });
    res.json(t);
  },

  create(req: Request, res: Response) {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    const t = tasksRepo.create(parsed.data);
    res.status(201).json(t);
  },

  update(req: Request, res: Response) {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors });

    const data: Record<string, unknown> = { ...parsed.data };
    const status = parsed.data.status;
    if (status === 'done') {
      data.completedAt = new Date().toISOString();
    } else if (status) {
      data.completedAt = null;
    }

    const t = tasksRepo.update(Number(req.params.id), data as Parameters<typeof tasksRepo.update>[1]);
    if (!t) return res.status(404).json({ error: 'Task not found' });
    res.json(t);
  },

  delete(req: Request, res: Response) {
    const id = Number(req.params.id);
    const t = tasksRepo.findById(id);
    if (!t) return res.status(404).json({ error: 'Task not found' });
    tasksRepo.delete(id);
    res.status(204).send();
  },
};
