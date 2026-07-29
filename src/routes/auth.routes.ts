import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { DirectorController } from '../controllers/DirectorController'; // Importe o controller do diretor
import { validateSchema } from '../middlewares/validateSchema';
import { LoginSchema, RegisterStudentSchema } from '../schemas/AuthSchema';

const authRoutes = Router();

authRoutes.post('/login', validateSchema(LoginSchema), AuthController.login);
authRoutes.post(
  '/register/student',
  validateSchema(RegisterStudentSchema),
  AuthController.registerStudent,
);

<<<<<<< Updated upstream
export { authRoutes };
=======
// Rota de registro de diretor apontando para o DirectorController.create
authRoutes.post(
  '/register/director',
  DirectorController.create,
);

export { authRoutes };
>>>>>>> Stashed changes
