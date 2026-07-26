import { Router } from 'express';
import { DisciplinaController } from '../controllers/DisciplinaController';

const disciplinaRoutes = Router();

disciplinaRoutes.post('/', DisciplinaController.create);
disciplinaRoutes.get('/', DisciplinaController.listAll);
disciplinaRoutes.post('/vincular', DisciplinaController.vincularUsuario);

export { disciplinaRoutes };
