import { Router } from 'express';
import { CertificadoController } from '../controllers/CertificadoController';
import { requireAuth, requireRoles } from '../middlewares/authenticate';

const certificadoRoutes = Router();

certificadoRoutes.get('/me', requireAuth, requireRoles('monitor'), CertificadoController.buscarMeuUltimo);
certificadoRoutes.post('/gerar', requireAuth, CertificadoController.gerarCertificado);
certificadoRoutes.post('/gerar-mensal', requireAuth, requireRoles('director', 'admin'), CertificadoController.gerarMensal);
certificadoRoutes.get('/:id/download', requireAuth, CertificadoController.download);

export { certificadoRoutes };
