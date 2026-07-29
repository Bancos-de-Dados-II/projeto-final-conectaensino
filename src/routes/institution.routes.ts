import { Router } from 'express';
import { InstitutionController } from '../controllers/InstitutionController';
import { validateSchema } from '../middlewares/validateSchema';
import { CreateInstitutionSchema } from '../schemas/InstitutionSchema';

const institutionRoutes = Router();

institutionRoutes.get('/', InstitutionController.listAll);
institutionRoutes.get('/nearby', InstitutionController.findNearby);
institutionRoutes.get('/:id', InstitutionController.getById);

institutionRoutes.post(
  '/',
  validateSchema(CreateInstitutionSchema),
  InstitutionController.create
);

export { institutionRoutes };
