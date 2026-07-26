import { Request, Response } from 'express';
import { MonitorProfile } from '../models/mongodb/MonitorProfile';
import { supabase } from '../config/supabase';

export const MonitorController = {
  // Criar Perfil de Monitor (Orquestrando MongoDB + Supabase)
  async create(req: Request, res: Response) {
    try {
      // Extraímos o email separadamente, pois o Supabase exige, e o resto vai pro Mongo
      const { email, ...monitorData } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'O campo email é obrigatório para o cadastro.' });
      }

      // 1. Criação do perfil não-relacional no MongoDB
      const monitor = await MonitorProfile.create(monitorData);

      // 2. Extrai o ObjectId gerado pelo MongoDB e converte para string
      const mongoProfileId = monitor._id.toString();

      // 3. Persistência relacional: Insere na tabela 'usuarios' do Supabase
      const { data: usuarioSupabase, error: supabaseError } = await supabase
        .from('usuarios')
        .insert([
          { 
            email: email, 
            mongo_profile_id: mongoProfileId 
          }
        ])
        .select()
        .single();

      // 4. O Rollback Manual
      if (supabaseError) {
        // Apaga o documento no Mongo se a inserção no Postgres falhar
        await MonitorProfile.findByIdAndDelete(monitor._id);
        
        return res.status(400).json({ 
          message: 'Erro de integridade relacional. Cadastro desfeito.', 
          error: supabaseError.message 
        });
      }

      // 5. Retorno de Sucesso
      return res.status(201).json({
        message: 'Monitor cadastrado com sucesso em ambos os bancos!',
        mongoData: monitor,
        supabaseData: usuarioSupabase
      });

    } catch (error: any) {
      return res.status(500).json({ message: 'Erro ao criar perfil de monitor.', error: error.message });
    }
  },

  async listAll(req: Request, res: Response) {
    try {
      // Popula o ID da instituição com o objeto da escola
      const monitors = await MonitorProfile.find().populate('institutionId', 'nome cnpj endereco');
      return res.status(200).json(monitors);
    } catch (error: any) {
      return res.status(500).json({ message: 'Erro ao listar monitores.', error: error.message });
    }
  },

  // Ajustado para usar o _id do Mongo como chave de busca principal
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const monitor = await MonitorProfile.findById(id).populate('institutionId');

      if (!monitor) {
        return res.status(404).json({ message: 'Monitor não encontrado.' });
      }

      return res.status(200).json(monitor);
    } catch (error: any) {
      return res.status(500).json({ message: 'Erro ao buscar monitor.', error: error.message });
    }
  },

  // Buscar monitores de uma instituição específica
  async getByInstitution(req: Request, res: Response) {
    try {
      const { institutionId } = req.params;
      const monitors = await MonitorProfile.find({ institutionId }).populate('institutionId');
      return res.status(200).json(monitors);
    } catch (error: any) {
      return res.status(500).json({ message: 'Erro ao buscar monitores da instituição.', error: error.message });
    }
  },

  // Busca Geoespacial (Perfeita para o MongoDB)
  async findNearby(req: Request, res: Response) {
    try {
      const { lng, lat, maxDistanceInMeters } = req.query;

      if (!lng || !lat) {
        return res.status(400).json({ message: 'Longitude (lng) e Latitude (lat) são obrigatórias.' });
      }

      const longitude = parseFloat(lng as string);
      const latitude = parseFloat(lat as string);
      const maxDistance = maxDistanceInMeters ? parseInt(maxDistanceInMeters as string) : 5000;

      const monitors = await MonitorProfile.find({
        ativo: true,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            $maxDistance: maxDistance,
          },
        },
      }).populate('institutionId', 'nome endereco');

      return res.status(200).json(monitors);
    } catch (error: any) {
      return res.status(500).json({ message: 'Erro na busca geoespacial.', error: error.message });
    }
  },
};