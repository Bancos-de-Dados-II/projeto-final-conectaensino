import { Router } from 'express';
import { SessionController } from '../controllers/SessionController';
import { SessionActivityController } from '../controllers/SessionActivityController';
import { requireAuth } from '../middlewares/authenticate';

const sessionRoutes = Router();

sessionRoutes.get('/', requireAuth, SessionController.listar);
sessionRoutes.get('/disponibilidade', requireAuth, SessionController.horariosDisponiveis);
sessionRoutes.get('/atividades', requireAuth, SessionActivityController.list);
sessionRoutes.get(
  '/atividades/:activityId/download',
  requireAuth,
  SessionActivityController.download,
);
sessionRoutes.post('/solicitar', requireAuth, SessionController.solicitarAula);
sessionRoutes.post('/:id/atividades', requireAuth, SessionActivityController.upload);
sessionRoutes.patch('/:id/status', requireAuth, SessionController.atualizarStatus);

export { sessionRoutes };
