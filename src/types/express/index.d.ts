import type { AuthenticatedUser } from '../../middlewares/authenticate';

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticatedUser;
  }
}

export {};