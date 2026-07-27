import { Router } from 'express';
import { CertificadoController } from '../controllers/CertificadoController';
import { requireAuth } from '../middlewares/authenticate';

const certificadoRoutes = Router();

certificadoRoutes.post('/gerar', requireAuth, CertificadoController.gerarCertificado);
certificadoRoutes.get('/:id/download', requireAuth, CertificadoController.download);

export { certificadoRoutes };
