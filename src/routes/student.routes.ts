import { Router } from 'express';
import { StudentController } from '../controllers/StudentController';
import { validateQuerySchema, validateSchema } from '../middlewares/validateSchema';
import { CreateStudentSchema } from '../schemas/StudentSchema';
import { GeoSearchSchema } from '../schemas/GeoSearchSchema';
import { requireAuth, requireRoles } from '../middlewares/authenticate';

const studentRoutes = Router();

studentRoutes.post(
  '/',
  requireAuth,
  requireRoles('director', 'admin'),
  validateSchema(CreateStudentSchema),
  StudentController.create
);

studentRoutes.get(
  '/',
  requireAuth,
  requireRoles('director', 'admin'),
  StudentController.listAll,
);
studentRoutes.get(
  '/:id/profile',
  requireAuth,
  requireRoles('monitor'),
  StudentController.getLinkedProfile,
);
studentRoutes.get('/proximos', validateQuerySchema(GeoSearchSchema), StudentController.proximos);
studentRoutes.get('/:userId', StudentController.getById);

export { studentRoutes };
