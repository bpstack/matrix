import { Request, Response } from 'express';
import { z } from 'zod';
import { projectsRepo } from '../repositories/projects.repository';
import { scanProject, collectTechStats } from '../engines/scanner';
import { activityRepo } from '../repositories/activity.repository';

const createSchema = z.object({
  name: z.string().min(1),
  path: z.string().optional(),
  description: z.string().optional(),
  url: z.string().optional(),
  status: z.enum(['active', 'paused', 'completed', 'archived']).optional(),
  tags: z.array(z.string()).optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  path: z.string().optional(),
  description: z.string().optional(),
  url: z.string().optional(),
  status: z.enum(['active', 'paused', 'completed', 'archived']).optional(),
  tags: z.array(z.string()).optional(),
});

export const projectsController = {
  getAll(_req: Request, res: Response) {
    const all = projectsRepo.findAll();
    const result = all.map((p) => ({
      ...p,
      tags: p.tags ? JSON.parse(p.tags) : [],
      techStats: p.techStats ? JSON.parse(p.techStats) : null,
      scan: projectsRepo.getLatestScan(p.id) || null,
    }));
    res.json(result);
  },

  getById(req: Request, res: Response) {
    const p = projectsRepo.findById(Number(req.params.id));
    if (!p) return res.status(404).json({ error: 'Project not found' });
    res.json({
      ...p,
      tags: p.tags ? JSON.parse(p.tags) : [],
      techStats: p.techStats ? JSON.parse(p.techStats) : null,
      scan: projectsRepo.getLatestScan(p.id) || null,
      links: projectsRepo.getLinks(p.id),
    });
  },

  create(req: Request, res: Response) {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors });

    const { tags, ...rest } = parsed.data;
    const p = projectsRepo.create({
      ...rest,
      tags: tags ? JSON.stringify(tags) : undefined,
    });

    // If path provided, auto-collect tech stats
    if (p.path) {
      const techStats = collectTechStats(p.path);
      projectsRepo.update(p.id, { techStats: JSON.stringify(techStats) });
    }

    activityRepo.log('created', 'project', p.id, `Created project: ${p.name}`);
    res.status(201).json({
      ...p,
      tags: p.tags ? JSON.parse(p.tags) : [],
      techStats: p.techStats ? JSON.parse(p.techStats) : null,
    });
  },

  update(req: Request, res: Response) {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors });

    const { tags, ...rest } = parsed.data;
    const data: Record<string, unknown> = { ...rest };
    if (tags !== undefined) data.tags = JSON.stringify(tags);

    const p = projectsRepo.update(Number(req.params.id), data as Parameters<typeof projectsRepo.update>[1]);
    if (!p) return res.status(404).json({ error: 'Project not found' });
    res.json({
      ...p,
      tags: p.tags ? JSON.parse(p.tags) : [],
      techStats: p.techStats ? JSON.parse(p.techStats) : null,
    });
  },

  delete(req: Request, res: Response) {
    const id = Number(req.params.id);
    const p = projectsRepo.findById(id);
    if (!p) return res.status(404).json({ error: 'Project not found' });
    projectsRepo.delete(id);
    res.status(204).send();
  },

  scan(req: Request, res: Response) {
    const id = Number(req.params.id);
    const p = projectsRepo.findById(id);
    if (!p) return res.status(404).json({ error: 'Project not found' });
    if (!p.path) return res.status(400).json({ error: 'Project has no path configured' });

    // Run scan
    const scanResult = scanProject(p.path);
    const scan = projectsRepo.upsertScan(id, {
      totalTasks: scanResult.totalTasks,
      completedTasks: scanResult.completedTasks,
      blockers: scanResult.blockers,
      wipItems: scanResult.wipItems,
      progressPercent: scanResult.progressPercent,
      rawData: JSON.stringify(scanResult.rawData),
    });

    // Also refresh tech stats
    const techStats = collectTechStats(p.path);
    projectsRepo.update(id, { techStats: JSON.stringify(techStats) });

    activityRepo.log('scanned', 'project', id, `Scanned project: ${p.name}`);
    res.json({ scan, techStats });
  },

  // Links
  addLink(req: Request, res: Response) {
    const id = Number(req.params.id);
    const p = projectsRepo.findById(id);
    if (!p) return res.status(404).json({ error: 'Project not found' });

    const schema = z.object({
      linkableType: z.enum(['mission', 'objective', 'plan', 'task']),
      linkableId: z.number(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors });

    try {
      const link = projectsRepo.addLink(id, parsed.data.linkableType, parsed.data.linkableId);
      res.status(201).json(link);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('UNIQUE')) {
        return res.status(409).json({ error: 'Link already exists' });
      }
      throw err;
    }
  },

  removeLink(req: Request, res: Response) {
    const linkId = Number(req.params.linkId);
    projectsRepo.removeLink(linkId);
    res.status(204).send();
  },
};
