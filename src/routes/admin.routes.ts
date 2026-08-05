import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { requireAuth, requireRoles } from '../middlewares/authenticate';

const adminRoutes = Router();
adminRoutes.use(requireAuth, requireRoles('admin'));
adminRoutes.get('/dashboard', AdminController.dashboard);
adminRoutes.get('/institutions', AdminController.institutions);
adminRoutes.get('/map', AdminController.mapEntities);
adminRoutes.get('/directors', AdminController.directors);
adminRoutes.get('/report.pdf', AdminController.exportReport);
adminRoutes.patch('/directors/:id/status', AdminController.setDirectorStatus);
adminRoutes.patch('/directors/:id/institution', AdminController.reallocateDirector);
adminRoutes.delete('/directors/:id', AdminController.deleteDirector);

export { adminRoutes };
