import express from 'express';
import { connectMongoDB } from './config/mongo';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

async function startServer() {
  await connectMongoDB();
  app.listen(PORT, () => {
    console.log(`⚡️ Servidor executando em http://localhost:${PORT}`);
  });
}

startServer();