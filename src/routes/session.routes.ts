import { Router } from 'express';
import { SessionController } from '../controllers/SessionController';

const sessionRoutes = Router();

sessionRoutes.post('/solicitar', SessionController.solicitarAula);
sessionRoutes.patch('/:id/status', SessionController.atualizarStatus);

export { sessionRoutes };
