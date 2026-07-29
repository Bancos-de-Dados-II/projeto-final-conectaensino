import mongoose from 'mongoose';
import dns from 'node:dns';
import dotenv from 'dotenv'; 

dotenv.config(); 

dns.setServers(['8.8.8.8', '8.8.4.4']);

export const connectMongoDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI não informada no .env");
  }

  try {
    await mongoose.connect(uri);
    console.log("🍃 Conectado ao MongoDB Atlas com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao conectar ao MongoDB:", error);
    process.exit(1);
  }
};