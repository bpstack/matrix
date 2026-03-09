import { Router } from 'express';
import { settingsController } from '../controllers/settings.controller';

const router = Router();

router.get('/settings', settingsController.getAll);
router.get('/settings/:key', settingsController.getByKey);
router.put('/settings/:key', settingsController.upsert);

export { router as settingsRouter };
