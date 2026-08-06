import { Router } from 'express';
import { DisciplinaController } from '../controllers/DisciplinaController';
import { requireAuth, requireRoles } from '../middlewares/authenticate';

const disciplinaRoutes = Router();

disciplinaRoutes.get('/catalog', requireAuth, DisciplinaController.catalog);
disciplinaRoutes.post('/suggestions', requireAuth, requireRoles('student', 'authenticated', 'monitor', 'director'), DisciplinaController.suggest);
disciplinaRoutes.get('/suggestions', requireAuth, requireRoles('admin'), DisciplinaController.listSuggestions);
disciplinaRoutes.patch('/suggestions/:id', requireAuth, requireRoles('admin'), DisciplinaController.reviewSuggestion);
disciplinaRoutes.post('/', requireAuth, DisciplinaController.create);
disciplinaRoutes.get('/', DisciplinaController.listAll);
disciplinaRoutes.post('/vincular', requireAuth, DisciplinaController.vincularUsuario);

export { disciplinaRoutes };
