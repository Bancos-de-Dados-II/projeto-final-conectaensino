import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { supabase } from './config/supabase';
import { studentRoutes } from './routes/student.routes';
import { monitorRoutes } from './routes/monitor.routes'; 
import { institutionRoutes } from './routes/institution.routes';
import rotasPrincipais from './routes'; 

dotenv.config();

const app = express();
app.use(express.json());

// Seus middlewares atuais
app.use('/api/students', studentRoutes);
app.use('/api/monitors', monitorRoutes); 
app.use('/api/institutions', institutionRoutes); 

//Plugando as rotas de disciplinas, sessoes, avaliacoes e certificados
app.use('/api', rotasPrincipais);

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/conecta_ensino';

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(' Conectado ao MongoDB com sucesso!');

    app.listen(PORT, () => {
      console.log(` Servidor rodando em http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(' Erro de conexão com o banco de dados:', error);
  }
}

start();

app.get('/api/teste-supabase', async (req, res) => {
  try {
    // Fazemos uma consulta numa tabela que nem precisa existir ainda
    const { data, error } = await supabase.from('tabela_teste_conexao').select('*').limit(1);

    res.json({
      status: "Requisição finalizada",
      dados: data,
      erro: error
    });
  } catch (err) {
    res.status(500).json({ falha_na_rede: err });
  }
});