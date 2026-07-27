import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { supabase } from './config/supabase';
import { connectRedis } from './config/redis'; 
import app from './app';

dotenv.config();

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/conecta_ensino';

// Rota de teste do Supabase
app.get('/api/teste-supabase', async (req, res) => {
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

async function start() {
  try {
    // 1. Conecta ao MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('🟢 Conectado ao MongoDB com sucesso!');

    // 2. Conecta ao Upstash Redis
    await connectRedis();

    // 3. Inicia o Servidor Express
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('🔴 Erro de conexão com os bancos de dados:', error);
  }
}

start();