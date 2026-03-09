import { Router } from 'express';
import { subscriptionsController } from '../controllers/subscriptions.controller';

const router = Router();

router.get('/subscriptions', subscriptionsController.getAll);
router.post('/subscriptions', subscriptionsController.create);
router.patch('/subscriptions/:id', subscriptionsController.update);
router.delete('/subscriptions/:id', subscriptionsController.delete);
router.patch('/subscriptions/:id/usage', subscriptionsController.updateUsage);

export { router as subscriptionsRouter };
