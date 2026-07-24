import { Router } from 'express';
import { studentRoutes } from './student.routes';
import { monitorRoutes } from './monitor.routes';

const routes = Router();

routes.use('/students', studentRoutes);
routes.use('/monitors', monitorRoutes);

export { routes };