import { Router } from 'express';
import { MonitorController } from '../controllers/MonitorController';
import { validateSchema } from '../middlewares/validateSchema';
import { requireAuth } from '../middlewares/authenticate';
import { CreateMonitorSchema } from '../schemas/MonitorSchema';

const monitorRoutes = Router();

monitorRoutes.get('/nearby', MonitorController.findNearby);
monitorRoutes.get('/institution/:institutionId', MonitorController.getByInstitution); // 👈 Nova rota
monitorRoutes.get('/', MonitorController.listAll);
monitorRoutes.get('/:userId', MonitorController.getById);

monitorRoutes.post(
  '/',
  requireAuth,
  validateSchema(CreateMonitorSchema),
  MonitorController.create
);

export { monitorRoutes };