import { Router } from 'express';
import { DisciplinaController } from '../controllers/DisciplinaController';
import { requireAuth } from '../middlewares/authenticate';

const disciplinaRoutes = Router();

disciplinaRoutes.post('/', requireAuth, DisciplinaController.create);
disciplinaRoutes.get('/', DisciplinaController.listAll);
disciplinaRoutes.post('/vincular', requireAuth, DisciplinaController.vincularUsuario);

export { disciplinaRoutes };
