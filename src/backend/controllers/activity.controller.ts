import { Request, Response } from 'express';
import { activityRepo } from '../repositories/activity.repository';

export const activityController = {
  getRecent(req: Request, res: Response) {
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    res.json(activityRepo.findRecent(limit));
  },
};
