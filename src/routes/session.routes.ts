import { Router } from 'express';
import { SessionController } from '../controllers/SessionController';
import { requireAuth } from '../middlewares/authenticate';

const sessionRoutes = Router();

sessionRoutes.post('/solicitar', requireAuth, SessionController.solicitarAula);
sessionRoutes.patch('/:id/status', requireAuth, SessionController.atualizarStatus);

export { sessionRoutes };
