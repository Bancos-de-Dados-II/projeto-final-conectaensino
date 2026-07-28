import { Request, Response } from 'express';
import { MonitorProfile } from '../models/mongodb/MonitorProfile';
import { Institution } from '../models/mongodb/Institution';
import { supabase } from '../config/supabase';
import * as crypto from 'crypto';
import { randomUUID } from 'crypto';

export const MonitorController = {
  // Criar Perfil de Monitor (Orquestrando MongoDB + Supabase)
  async create(req: Request, res: Response) {
    try {
      console.log('--- INÍCIO DO CADASTRO DE MONITOR COM AUTH ---');
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
        return res.status(400).json({ message: 'O campo email é obrigatório.' });
      }

      // 1. Validar se o e-mail já existe na tabela usuarios do Supabase (Unicidade)
      const { data: existingUser } = await supabase
        .from('usuarios')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        return res.status(400).json({ message: 'Já existe um monitor cadastrado com este e-mail.' });
      }

      // 2. Resolver localização da instituição ou coordenadas
      let monitorLocation;
      const isMongoId = institutionId && /^[0-9a-fA-F]{24}$/.test(institutionId);

      if (isMongoId) {
        const institution = await Institution.findById(institutionId);
        if (!institution) {
          return res.status(404).json({ message: 'Instituição não encontrada.' });
        }
        const instData = institution.toObject() as any;
        monitorLocation = {
          type: 'Point',
          coordinates: [instData.longitude || instData.lng || 0, instData.latitude || instData.lat || 0]
        };
      } else if (location && location.coordinates && location.coordinates.length === 2) {
        monitorLocation = {
          type: 'Point',
          coordinates: [parseFloat(location.coordinates[0]), parseFloat(location.coordinates[1])]
        };
      } else {
        return res.status(400).json({ message: 'Instituição ou coordenadas geográficas são obrigatórias.' });
      }

      // 3. Gerar senha aleatória segura para o primeiro acesso
      const randomPassword = crypto.randomBytes(6).toString('hex') + '!1A'; // Ex: a3f9b2!1A
      const resolvedName = name || nome || fullName || nomeCompleto || email.split('@')[0];

      // 4. Criar usuário no Supabase Auth (Gera credenciais reais de login)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: randomPassword,
        email_confirm: true, // Já deixa o e-mail confirmado
        user_metadata: { name: resolvedName, role: 'monitor' }
      });

      if (authError) {
        console.error('Erro ao criar usuário no Supabase Auth:', authError);
        return res.status(400).json({ message: 'Erro ao gerar credenciais de acesso.', error: authError.message });
      }

      const authUserId = authData.user.id;

      // 5. Salvar perfil detalhado no MongoDB
      const finalMonitorData = {
        ...monitorData,
        name: resolvedName,
        userId: authUserId, 
        institutionId: isMongoId ? institutionId : undefined,
        location: monitorLocation
      };

      const monitor = await MonitorProfile.create(finalMonitorData);
      const mongoProfileId = monitor._id.toString();

      // 6. Inserir na tabela relacional 'usuarios' do Supabase vinculando o Auth e o Mongo
      const { error: supabaseTableError } = await supabase
        .from('usuarios')
        .insert([
          { 
            id: authUserId, // ID do Supabase Auth
            email: email, 
            mongo_profile_id: mongoProfileId 
          }
        ]);

      if (supabaseTableError) {
        console.error('Erro na tabela usuarios do Supabase. Executando rollback...', supabaseTableError);
        await supabase.auth.admin.deleteUser(authUserId);
        await MonitorProfile.findByIdAndDelete(monitor._id);
        
        return res.status(400).json({ 
          message: 'Erro de integridade ao salvar usuário. Cadastro desfeito.', 
          error: supabaseTableError.message 
        });
      }

      console.log(`Monitor cadastrado com sucesso! E-mail: ${email} | Senha gerada: ${randomPassword}`);
      
      return res.status(201).json({
        message: 'Monitor cadastrado com sucesso com acesso ao sistema!',
        email: email,
        senhaTemporaria: randomPassword, // Você pode exibir isso no console/resposta para teste
        mongoData: monitor
      });

    } catch (error: any) {
      console.error('Erro crítico no cadastro de monitor:', error);
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

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      console.log('--- INÍCIO DA EXCLUSÃO DE MONITOR --- ID:', id);

      const monitor = await MonitorProfile.findById(id);
      if (!monitor) {
        return res.status(404).json({ message: 'Monitor não encontrado.' });
      }

      // Remove o registro correspondente na tabela 'usuarios' do Supabase
      const { error: supabaseError } = await supabase
        .from('usuarios')
        .delete()
        .eq('mongo_profile_id', id);

      if (supabaseError) {
        console.error('Erro ao excluir do Supabase:', supabaseError);
      }

      // Deleta o perfil do monitor no MongoDB
      await MonitorProfile.findByIdAndDelete(id);

      console.log('Monitor excluído com sucesso de ambos os bancos!');
      return res.status(200).json({ message: 'Monitor excluído com sucesso!' });
    } catch (error: any) {
      console.error('Erro crítico ao excluir monitor:', error);
      return res.status(500).json({ message: 'Erro ao excluir monitor.', error: error.message });
    }
  },
};