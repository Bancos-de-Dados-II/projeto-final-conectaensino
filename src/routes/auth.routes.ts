import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { DirectorController } from '../controllers/DirectorController'; 
import { validateSchema } from '../middlewares/validateSchema';
import { LoginSchema, RegisterStudentSchema } from '../schemas/AuthSchema';
import { requireAuth } from '../middlewares/authenticate'; 

const authRoutes = Router();

authRoutes.post('/login', validateSchema(LoginSchema), AuthController.login);
authRoutes.post(
  '/register/student',
  validateSchema(RegisterStudentSchema),
  AuthController.registerStudent,
);

authRoutes.post(
  '/register/director',
  DirectorController.create,
);

authRoutes.post('/logout', requireAuth, AuthController.logout);

export { authRoutes };