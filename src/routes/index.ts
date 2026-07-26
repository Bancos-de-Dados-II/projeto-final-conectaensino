import { Router } from 'express';
import { studentRoutes } from './student.routes';
import { monitorRoutes } from './monitor.routes';
import { disciplinaRoutes } from './disciplina.routes';
import { avaliacaoRoutes } from './avaliacao.routes';
import { sessionRoutes } from './session.routes.js';
import { certificadoRoutes } from './certificado.routes.js';

const router = Router();

router.use('/students', studentRoutes);
router.use('/monitors', monitorRoutes);
router.use('/disciplinas', disciplinaRoutes);
router.use('/avaliacoes', avaliacaoRoutes);
router.use('/sessoes', sessionRoutes);
router.use('/certificados', certificadoRoutes);

export default router;