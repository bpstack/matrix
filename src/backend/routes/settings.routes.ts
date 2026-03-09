import { Router } from 'express';
import { settingsController } from '../controllers/settings.controller';
import { dbController } from '../controllers/db.controller';

const router = Router();

router.get('/settings', settingsController.getAll);
router.get('/settings/:key', settingsController.getByKey);
router.put('/settings/:key', settingsController.upsert);
router.post('/db/reset', dbController.reset);

export { router as settingsRouter };
