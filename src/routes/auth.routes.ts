import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validateSchema } from '../middlewares/validateSchema';
import { LoginSchema } from '../schemas/AuthSchema';

const authRoutes = Router();

authRoutes.post('/login', validateSchema(LoginSchema), AuthController.login);

export { authRoutes };