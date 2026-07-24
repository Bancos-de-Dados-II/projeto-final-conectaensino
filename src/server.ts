import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import { studentRoutes } from './routes/student.routes';
import { monitorRoutes } from './routes/monitor.routes'; 
import { institutionRoutes } from './routes/institution.routes';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/api/students', studentRoutes);
app.use('/api/monitors', monitorRoutes); 
app.use('/api/institutions', institutionRoutes); 

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/conecta_ensino';

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado ao MongoDB com sucesso!');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erro de conexão com o banco de dados:', error);
  }
}

start();