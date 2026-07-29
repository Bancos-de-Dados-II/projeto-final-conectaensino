import { Router } from 'express';
import { ChatController } from '../controllers/ChatController';
import { requireAuth, requireRoles } from '../middlewares/authenticate';

const chatRoutes = Router();
chatRoutes.use(requireAuth, requireRoles('student', 'authenticated', 'monitor'));
chatRoutes.get('/conversations', ChatController.conversations);
chatRoutes.get(
  '/conversations/:conversationId/messages',
  ChatController.messages,
);
chatRoutes.post('/messages', ChatController.send);
chatRoutes.patch('/conversations/:conversationId/read', ChatController.read);

export { chatRoutes };
