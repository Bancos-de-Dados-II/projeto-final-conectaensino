import express from 'express';
import cors from 'cors';
import { studentRoutes } from './routes/student.routes';
import { monitorRoutes } from './routes/monitor.routes';
import { institutionRoutes } from './routes/institution.routes';
import rotasPrincipais from './routes';

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());
app.use('/api/estudantes', studentRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api', rotasPrincipais);

export default app;