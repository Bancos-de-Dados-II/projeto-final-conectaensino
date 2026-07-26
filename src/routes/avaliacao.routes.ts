import { Router } from 'express';
import { AvaliacaoController } from '../controllers/AvaliacaoController';

const avaliacaoRoutes = Router();

avaliacaoRoutes.post('/', AvaliacaoController.create);

export { avaliacaoRoutes };
