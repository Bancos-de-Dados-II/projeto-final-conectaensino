import { Router } from 'express';
import { AccountProfileController } from '../controllers/AccountProfileController';
import { requireAuth, requireRoles } from '../middlewares/authenticate';

const profileRoutes = Router();

profileRoutes.get(
  '/',
  requireAuth,
  requireRoles('student', 'authenticated', 'monitor', 'director'),
  AccountProfileController.get,
);

profileRoutes.put(
  '/',
  requireAuth,
  requireRoles('student', 'authenticated', 'monitor', 'director'),
  AccountProfileController.update,
);

profileRoutes.patch(
  '/password',
  requireAuth,
  requireRoles('student', 'authenticated', 'monitor'),
  AccountProfileController.password,
);

profileRoutes.patch(
  '/avatar',
  requireAuth,
  requireRoles('student', 'authenticated', 'monitor', 'director'),
  AccountProfileController.avatar,
);

profileRoutes.patch(
  '/institution',
  requireAuth,
  requireRoles('student', 'authenticated', 'director'),
  AccountProfileController.institution,
);

export { profileRoutes };