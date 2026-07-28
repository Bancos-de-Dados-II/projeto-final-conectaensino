import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validateSchema } from '../middlewares/validateSchema';
import { LoginSchema, RegisterStudentSchema } from '../schemas/AuthSchema';

const authRoutes = Router();

authRoutes.post('/login', validateSchema(LoginSchema), AuthController.login);
authRoutes.post(
  '/register/student',
  validateSchema(RegisterStudentSchema),
  AuthController.registerStudent,
);

export { authRoutes };
