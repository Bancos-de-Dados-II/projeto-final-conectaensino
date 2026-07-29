import { Router } from 'express';
import { TaskController } from '../controllers/TaskController';
import { requireAuth, requireRoles } from '../middlewares/authenticate';

const taskRoutes = Router();

taskRoutes.get('/students', requireAuth, requireRoles('monitor'), TaskController.students);
taskRoutes.get('/', requireAuth, TaskController.list);
taskRoutes.post('/', requireAuth, requireRoles('monitor'), TaskController.create);
taskRoutes.patch('/:id/status', requireAuth, TaskController.updateStatus);

export { taskRoutes };
