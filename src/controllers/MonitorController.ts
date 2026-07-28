import { Request, Response } from 'express';
import { MonitorProfile } from '../models/mongodb/MonitorProfile';
import { Institution } from '../models/mongodb/Institution';
import { supabase } from '../config/supabase';
import { randomUUID } from 'crypto';

export const MonitorController = {
  // Criar Perfil de Monitor (Orquestrando MongoDB + Supabase)
  async create(req: Request, res: Response) {
    try {
      console.log('--- INÍCIO DO CADASTRO DE MONITOR ---');
      console.log('Payload recebido no body:', req.body);

      // Extraímos todas as variações possíveis que o front-end pode enviar para o nome
      const { 
        email, 
        institutionId, 
        location, 
        userId, 
        name, 
        nome, 
        fullName, 
        nomeCompleto, 
        ...monitorData 
      } = req.body;

      if (!email) {
        console.log('Erro: E-mail não informado.');
        return res.status(400).json({ message: 'O campo email é obrigatório para o cadastro.' });
      }

      let monitorLocation;
      const isMongoId = institutionId && /^[0-9a-fA-F]{24}$/.test(institutionId);

      if (isMongoId) {
        console.log('Buscando instituição no MongoDB por ID:', institutionId);
        const institution = await Institution.findById(institutionId);
        if (!institution) {
          console.log('Erro: Instituição não encontrada no MongoDB.');
          return res.status(404).json({ message: 'Instituição não encontrada.' });
        }

        const instData = institution.toObject() as any;
        monitorLocation = {
          type: 'Point',
          coordinates: [
            instData.longitude || instData.lng || 0,
            instData.latitude || instData.lat || 0
          ]
        };
      } else if (location && location.coordinates && location.coordinates.length === 2) {
        console.log('Usando coordenadas diretas do payload:', location.coordinates);
        monitorLocation = {
          type: 'Point',
          coordinates: [
            parseFloat(location.coordinates[0]), // Longitude
            parseFloat(location.coordinates[1])  // Latitude
          ]
        };
      } else {
        console.log('Erro: Nem instituição válida do Mongo nem coordenadas foram fornecidas.');
        return res.status(400).json({ message: 'A instituição válida ou as coordenadas geográficas são obrigatórias.' });
      }

      // Gerando um ID único aleatório para cada novo cadastro
      const uniqueUserId = `user-${randomUUID()}`;

      // Prioriza rigorosamente o nome digitado no formulário
      const resolvedName = name || nome || fullName || nomeCompleto || email.split('@')[0];

      const finalMonitorData = {
        ...monitorData,
        name: resolvedName, // Salva o nome real preenchido no input do modal na raiz do MongoDB
        userId: uniqueUserId, 
        institutionId: isMongoId ? institutionId : undefined,
        location: monitorLocation
      };

      console.log('Salvando MonitorProfile no MongoDB com userId:', uniqueUserId);
      const monitor = await MonitorProfile.create(finalMonitorData);
      const mongoProfileId = monitor._id.toString();
      console.log('Monitor salvo no MongoDB com ID:', mongoProfileId);

      console.log('Inserindo usuário na tabela usuarios do Supabase...');
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

      if (supabaseError) {
        console.error('Erro retornado pelo Supabase:', supabaseError);
        console.log('Executando rollback: removendo do MongoDB o ID:', monitor._id);
        await MonitorProfile.findByIdAndDelete(monitor._id);
        
        return res.status(400).json({ 
          message: 'Erro de integridade relacional. Cadastro desfeito.', 
          error: supabaseError.message 
        });
      }

      console.log('Cadastro realizado com sucesso em ambos os bancos!');
      return res.status(201).json({
        message: 'Monitor cadastrado com sucesso em ambos os bancos!',
        mongoData: monitor,
        supabaseData: usuarioSupabase
      });

    } catch (error: any) {
      console.error('Erro crítico no bloco catch do MonitorController:', error);
      return res.status(500).json({ message: 'Erro ao criar perfil de monitor.', error: error.message });
    }
  },

  async listAll(req: Request, res: Response) {
    try {
      // 1. Busca todos os perfis de monitores no MongoDB populando a instituição
      const monitors = await MonitorProfile.find().populate('institutionId', 'nome cnpj endereco').lean();

      // 2. Busca todos os registros correspondentes na tabela 'usuarios' do Supabase para recuperar os e-mails
      const { data: usuariosSupabase, error: supError } = await supabase
        .from('usuarios')
        .select('email, mongo_profile_id');

      if (supError) {
        console.error('Erro ao buscar e-mails do Supabase:', supError);
      }

      // 3. Cria um mapa de mongo_profile_id -> email para cruzar os dados rapidamente
      const emailMap = new Map<string, string>();
      if (usuariosSupabase) {
        usuariosSupabase.forEach((user) => {
          if (user.mongo_profile_id) {
            emailMap.set(user.mongo_profile_id, user.email);
          }
        });
      }

      // 4. Injeta o e-mail correspondente em cada monitor retornado
      const enrichedMonitors = monitors.map((monitor) => {
        const profileId = monitor._id.toString();
        return {
          ...monitor,
          id: profileId, // Garante que o ID mapeado seja compatível com o CRUD do front
          email: emailMap.get(profileId) || '—'
        };
      });

      return res.status(200).json(enrichedMonitors);
    } catch (error: any) {
      return res.status(500).json({ message: 'Erro ao listar monitores.', error: error.message });
    }
  },

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

  async getByInstitution(req: Request, res: Response) {
    try {
      const { institutionId } = req.params;
      const monitors = await MonitorProfile.find({ institutionId }).populate('institutionId');
      return res.status(200).json(monitors);
    } catch (error: any) {
      return res.status(500).json({ message: 'Erro ao buscar monitores da instituição.', error: error.message });
    }
  },

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