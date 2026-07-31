import { Router } from 'express';
import { studentRoutes } from './student.routes';
import { monitorRoutes } from './monitor.routes';
import { disciplinaRoutes } from './disciplina.routes';
import { avaliacaoRoutes } from './avaliacao.routes';
import { sessionRoutes } from './session.routes.js';
import { certificadoRoutes } from './certificado.routes.js';
import { authRoutes } from './auth.routes';
import { directorRoutes } from './director.routes'; 
import { taskRoutes } from './task.routes';
import { profileRoutes } from './profile.routes';
import { chatRoutes } from './chat.routes';
import { adminRoutes } from './admin.routes';

const router = Router();

router.use('/students', studentRoutes);
router.use('/monitors', monitorRoutes);
router.use('/disciplinas', disciplinaRoutes);
router.use('/avaliacoes', avaliacaoRoutes);
router.use('/sessoes', sessionRoutes);
router.use('/certificados', certificadoRoutes);
router.use('/auth', authRoutes);
router.use('/directors', directorRoutes); 
router.use('/tasks', taskRoutes);
router.use('/profile', profileRoutes);
router.use('/chat', chatRoutes);
router.use('/admins', adminRoutes);

export default router;
