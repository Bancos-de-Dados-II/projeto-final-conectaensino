import { Router } from 'express';
import { SessionController } from '../controllers/SessionController';
import { requireAuth } from '../middlewares/authenticate';

const sessionRoutes = Router();

sessionRoutes.get('/', requireAuth, SessionController.listar);
sessionRoutes.get('/disponibilidade', requireAuth, SessionController.horariosDisponiveis);
sessionRoutes.post('/solicitar', requireAuth, SessionController.solicitarAula);
sessionRoutes.patch('/:id/status', requireAuth, SessionController.atualizarStatus);

export { sessionRoutes };
