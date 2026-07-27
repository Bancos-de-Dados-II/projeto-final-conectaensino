import express from 'express';
import { studentRoutes } from './routes/student.routes';
import { monitorRoutes } from './routes/monitor.routes';
import { institutionRoutes } from './routes/institution.routes';
import rotasPrincipais from './routes';

const app = express();

app.use(express.json());
app.use('/api/estudantes', studentRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api', rotasPrincipais);

export default app;