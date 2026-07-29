import { Router } from 'express';
import { MonitorController } from '../controllers/MonitorController';
import { validateSchema } from '../middlewares/validateSchema';
import { requireAuth, requireRoles } from '../middlewares/authenticate';
import { CreateMonitorSchema } from '../schemas/MonitorSchema';

const monitorRoutes = Router();

monitorRoutes.get('/nearby', MonitorController.findNearby);
monitorRoutes.get(
  '/me',
  requireAuth,
  requireRoles('monitor'),
  MonitorController.getOwnProfile,
);
monitorRoutes.patch(
  '/me/institution',
  requireAuth,
  requireRoles('monitor'),
  MonitorController.updateOwnInstitution,
);
monitorRoutes.patch(
  '/me/avatar',
  requireAuth,
  requireRoles('monitor'),
  MonitorController.updateOwnAvatar,
);
monitorRoutes.get('/institution/:institutionId', MonitorController.getByInstitution);
monitorRoutes.get('/', requireAuth, MonitorController.listAll);
monitorRoutes.get('/:userId', MonitorController.getById);

monitorRoutes.post(
  '/',
  requireAuth,
  requireRoles('director', 'admin'),
  validateSchema(CreateMonitorSchema),
  MonitorController.create
);

// 👇 Adicione esta rota para permitir a exclusão
monitorRoutes.delete(
  '/:id',
  requireAuth,
  requireRoles('director', 'admin'),
  MonitorController.delete,
);

export { monitorRoutes };
