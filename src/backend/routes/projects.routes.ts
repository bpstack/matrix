import { Router } from 'express';
import { projectsController } from '../controllers/projects.controller';

const router = Router();

router.get('/projects', projectsController.getAll);
router.get('/projects/:id', projectsController.getById);
router.post('/projects', projectsController.create);
router.patch('/projects/:id', projectsController.update);
router.delete('/projects/:id', projectsController.delete);
router.post('/projects/:id/scan', projectsController.scan);
router.post('/projects/:id/links', projectsController.addLink);
router.delete('/projects/:id/links/:linkId', projectsController.removeLink);

export { router as projectsRouter };
