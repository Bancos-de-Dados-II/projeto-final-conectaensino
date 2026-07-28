import { Router } from 'express';
import { DirectorController } from '../controllers/DirectorController';
// Se você tiver um middleware de validação e um schema específico para diretores:
// import { validateSchema } from '../middlewares/validateSchema';
// import { RegisterDirectorSchema } from '../schemas/AuthSchema';

const directorRoutes = Router();

directorRoutes.post(
  '/register',
  // validateSchema(RegisterDirectorSchema), // Opcional, caso queira validar com schema
  DirectorController.create
);

export { directorRoutes };