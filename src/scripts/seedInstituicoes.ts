import fs from 'fs';
import path from 'path';
import csv from 'csv-parser'; 
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Institution } from "../models/mongodb/Institution"; 

dotenv.config();

interface EscolaRow {
  codigo_inep: string;
  nome_escola: string;
  codigo_ibge: string;
  latitude: string;
  longitude: string;
  tem_rampa: string;
  tem_banheiro_pcd: string;
  acesso_total: string;
}

async function seed() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ensino';
    await mongoose.connect(mongoUri);
    console.log('📦 Conectado ao MongoDB para o seed...');

    const results: EscolaRow[] = [];
    const csvFilePath = path.resolve(__dirname, '../../escolas_pb_limpo.csv');

    if (!fs.existsSync(csvFilePath)) {
      console.error(`❌ Arquivo CSV não encontrado em: ${csvFilePath}`);
      process.exit(1);
    }

    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data: EscolaRow) => results.push(data))
      .on('end', async () => {
        console.log(`📊 Encontradas ${results.length} escolas no CSV. Processando inserção...`);

        const operations = results
          .filter((row) => {
            const lat = parseFloat(row.latitude);
            const lon = parseFloat(row.longitude);
            return !isNaN(lat) && !isNaN(lon); 
          })
          .map((row) => {
            const lat = parseFloat(row.latitude);
            const lon = parseFloat(row.longitude);

            return {
              updateOne: {
                filter: { codigoInep: String(row.codigo_inep?.trim()) },
                update: {
                  $set: {
                    nome: row.nome_escola?.trim(),
                    codigoInep: String(row.codigo_inep?.trim()),
                    codigoIbge: row.codigo_ibge?.trim(),
                    temRampa: row.tem_rampa?.trim().toLowerCase() === 'true',
                    temBanheiroPcd: row.tem_banheiro_pcd?.trim().toLowerCase() === 'true',
                    acessoTotal: row.acesso_total?.trim().toLowerCase() === 'true',
                    diretorResponsavel: {
                      nome: 'Não informado',
                      email: `diretor.inep${row.codigo_inep?.trim()}@educacao.pb.gov.br`,
                      telefone: '(83) 0000-0000',
                    },
                    endereco: `Paraíba, PB (Código IBGE: ${row.codigo_ibge?.trim()})`,
                    location: {
                      type: 'Point' as const, 
                      coordinates: [lon, lat] as [number, number], 
                    },
                    ativa: true,
                  },
                },
                upsert: true,
              },
            };
          });

        const chunkSize = 500;
        for (let i = 0; i < operations.length; i += chunkSize) {
          const chunk = operations.slice(i, i + chunkSize);
          await Institution.bulkWrite(chunk);
          console.log(`⚡ Processados ${Math.min(i + chunkSize, operations.length)} / ${operations.length} registros...`);
        }

        console.log('✅ Povoamento da coleção de instituições concluído com sucesso!');
        await mongoose.disconnect();
        process.exit(0);
      });

  } catch (error) {
    console.error('❌ Erro durante o processo de seed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();