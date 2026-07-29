import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { supabase } from './config/supabase';
import { connectRedis } from './config/redis'; 
import app from './app';
import { Task } from './models/mongodb/Task';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ensino';

// Schema/Model temporário para as Atividades (caso queira usar Mongoose direto)
// Rota de teste do Supabase
app.get('/api/teste-supabase', async (_req, res) => {
  try {
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

// --- NOVAS ROTAS DE ATIVIDADES (KANBAN) ---

// 1. Buscar apenas os alunos associados ao monitor logado com base nas sessões
app.get('/api/monitors/my-students', async (req, res) => {
  try {
    // Se você usa o Supabase Auth ou token próprio, o ID/Email do monitor virá no req.user
    // Caso esteja testando livremente, você pode ajustar conforme o seu middleware de auth
    const monitorEmail = req.query.monitorEmail || req.user?.email;

    // Buscando alunos únicos através da collection de sessões no MongoDB
    const students = await mongoose.connection.collection('sessions').aggregate([
      { $match: { $or: [{ monitorEmail: monitorEmail }, { monitorId: req.user?.id }] } },
      { 
        $group: { 
          _id: "$studentEmail", 
          name: { $first: "$studentName" }, 
          email: { $first: "$studentEmail" } 
        } 
      }
    ]).toArray();

    return res.json(students);
  } catch (error) {
    console.error("Erro ao carregar alunos do monitor:", error);
    return res.status(500).json({ error: 'Erro ao carregar a lista de alunos.' });
  }
});

// 2. Criar e atribuir a nova atividade ao aluno
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, subject, studentEmail } = req.body;
    const monitorName = req.body.monitorName || "Monitor";

    const newTask = await Task.create({
      title,
      description,
      subject,
      studentEmail,
      monitorName,
      status: "pending"
    });

    return res.status(201).json({ message: "Atividade criada com sucesso!", task: newTask });
  } catch (error) {
    console.error("Erro ao criar atividade:", error);
    return res.status(500).json({ error: "Erro ao criar atividade." });
  }
});

// 3. Buscar tarefas do aluno logado (para popular o Kanban no Dashboard)
app.get('/api/tasks', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "E-mail do aluno não informado." });
    }

    const tasks = await Task.find({ studentEmail: String(email) }).sort({ createdAt: -1 });
    return res.json(tasks);
  } catch (error) {
    console.error("Erro ao buscar tarefas:", error);
    return res.status(500).json({ error: "Erro ao buscar tarefas." });
  }
});

// ------------------------------------------

async function start() {
  try {
    // 1. Conecta ao MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('🟢 Conectado ao MongoDB com sucesso!');

    // 2. Conecta ao Upstash Redis
    await connectRedis();

    // 3. Inicia o Servidor Express (ouvindo em 0.0.0.0 para compatibilidade com o Render)
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('🔴 Erro de conexão com os bancos de dados:', error);
  }
}

start();
