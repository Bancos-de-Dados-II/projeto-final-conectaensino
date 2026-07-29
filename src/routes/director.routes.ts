import { Router } from 'express';
import { DirectorController } from '../controllers/DirectorController';
import { DirectorDashboardController } from '../controllers/DirectorDashboardController';
import { requireAuth, requireRoles } from '../middlewares/authenticate';
// Se você tiver um middleware de validação e um schema específico para diretores:
// import { validateSchema } from '../middlewares/validateSchema';
// import { RegisterDirectorSchema } from '../schemas/AuthSchema';

const directorRoutes = Router();

directorRoutes.get('/dashboard', requireAuth, requireRoles('director'), DirectorDashboardController.dashboard);
directorRoutes.get('/registration-history', requireAuth, requireRoles('director'), DirectorDashboardController.registrationHistory);
directorRoutes.get('/school-students', requireAuth, requireRoles('director'), DirectorDashboardController.students);
directorRoutes.get('/school-monitors', requireAuth, requireRoles('director'), DirectorDashboardController.monitors);
directorRoutes.get('/notes', requireAuth, requireRoles('director'), DirectorDashboardController.notes);
directorRoutes.post('/notes', requireAuth, requireRoles('director'), DirectorDashboardController.createNote);
directorRoutes.delete('/notes/:id', requireAuth, requireRoles('director'), DirectorDashboardController.deleteNote);
directorRoutes.get('/messages', requireAuth, requireRoles('director'), DirectorDashboardController.messages);
directorRoutes.post('/messages', requireAuth, requireRoles('director'), DirectorDashboardController.sendMessage);

directorRoutes.post(
  '/register',
  // validateSchema(RegisterDirectorSchema), // Opcional, caso queira validar com schema
  DirectorController.create
);

export { directorRoutes };
