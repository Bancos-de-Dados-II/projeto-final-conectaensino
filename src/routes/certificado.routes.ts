import { Router } from 'express';
import { CertificadoController } from '../controllers/CertificadoController';

const certificadoRoutes = Router();

certificadoRoutes.post('/gerar', CertificadoController.gerarCertificado);

export { certificadoRoutes };
