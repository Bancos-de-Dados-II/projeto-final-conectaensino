import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { DirectorController } from '../controllers/DirectorController'; // Importe o controller do diretor
import { validateSchema } from '../middlewares/validateSchema';
import { LoginSchema, RegisterStudentSchema } from '../schemas/AuthSchema';
import { requireAuth } from '../middlewares/authenticate'; // <-- Importe o middleware de autenticação

const authRoutes = Router();

authRoutes.post('/login', validateSchema(LoginSchema), AuthController.login);
authRoutes.post(
  '/register/student',
  validateSchema(RegisterStudentSchema),
  AuthController.registerStudent,
);

// Rota de registro de diretor apontando para o DirectorController.create
authRoutes.post(
  '/register/director',
  DirectorController.create,
);

// Rota de logout protegida (exige que o usuário esteja autenticado para remover a sessão do Redis)
authRoutes.post('/logout', requireAuth, AuthController.logout);

export { authRoutes };