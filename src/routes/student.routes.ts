import { Router } from 'express';
import { StudentController } from '../controllers/StudentController';
import { validateSchema } from '../middlewares/validateSchema';
import { CreateStudentSchema } from '../schemas/StudentSchema';

const studentRoutes = Router();

studentRoutes.post(
  '/',
  validateSchema(CreateStudentSchema),
  StudentController.create
);
studentRoutes.get('/', StudentController.listAll);
studentRoutes.get('/:userId', StudentController.getById);

export { studentRoutes }