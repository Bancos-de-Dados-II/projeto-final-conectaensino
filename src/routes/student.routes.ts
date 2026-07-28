import { Router } from 'express';
import { StudentController } from '../controllers/StudentController';
import { validateQuerySchema, validateSchema } from '../middlewares/validateSchema';
import { requireAuth } from '../middlewares/authenticate';
import { CreateStudentSchema } from '../schemas/StudentSchema';
import { GeoSearchSchema } from '../schemas/GeoSearchSchema';

const studentRoutes = Router();

// Rota pública para o cadastro de novos estudantes
studentRoutes.post(
  '/',
  validateSchema(CreateStudentSchema),
  StudentController.create
);

studentRoutes.get('/', StudentController.listAll);
studentRoutes.get('/proximos', validateQuerySchema(GeoSearchSchema), StudentController.proximos);
studentRoutes.get('/:userId', StudentController.getById);

export { studentRoutes };