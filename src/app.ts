import express from 'express';
import cors from 'cors';
import { studentRoutes } from './routes/student.routes';
import { institutionRoutes } from './routes/institution.routes';
import rotasPrincipais from './routes';

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://127.0.0.1:5173', 
    'http://localhost:3000',
    'https://projeto-final-conectaensino-1.onrender.com' // <-- Adicione a URL exata do seu frontend no Render aqui
  ],
  credentials: true,
}));
app.use(express.json());
app.use('/api/estudantes', studentRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api', rotasPrincipais);

export default app;
