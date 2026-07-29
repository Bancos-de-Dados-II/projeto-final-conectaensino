import { Request, Response } from 'express';
import { MonitorProfile } from '../models/mongodb/MonitorProfile';
import { Institution } from '../models/mongodb/Institution';
import { supabase, supabaseAdmin } from '../config/supabase';
import * as crypto from 'crypto';

export const MonitorController = {
  async getOwnProfile(req: Request, res: Response) {
    try {
      const monitor = await MonitorProfile.findOne({ userId: req.user?.id })
        .select('+avatarData +avatarMimeType')
        .populate('institutionId', 'nome endereco location')
        .lean();
      if (!monitor) {
        return res.status(404).json({ message: 'Perfil de monitor não encontrado.' });
      }
      const avatar =
        monitor.avatarData && monitor.avatarMimeType
          ? `data:${monitor.avatarMimeType};base64,${monitor.avatarData.toString('base64')}`
          : undefined;
      const { avatarData: _avatarData, ...safeMonitor } = monitor;
      return res.status(200).json({ ...safeMonitor, avatar });
    } catch (error: any) {
      return res.status(500).json({
        message: 'Erro ao carregar perfil do monitor.',
        error: error.message,
      });
    }
  },

  async updateOwnAvatar(req: Request, res: Response) {
    try {
      const contentBase64 =
        typeof req.body?.contentBase64 === 'string'
          ? req.body.contentBase64
          : '';
      const rawBase64 = contentBase64.replace(/^data:[^;]+;base64,/, '');
      const data = Buffer.from(rawBase64, 'base64');
      if (!data.length || data.length > 2 * 1024 * 1024) {
        return res.status(400).json({
          message: 'A foto deve possuir no máximo 2 MB.',
        });
      }

      const isJpeg =
        data.length >= 3
        && data[0] === 0xff
        && data[1] === 0xd8
        && data[2] === 0xff;
      const pngSignature = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);
      const isPng = data.subarray(0, 8).equals(pngSignature);
      if (!isJpeg && !isPng) {
        return res.status(400).json({
          message: 'Formato inválido. Envie uma foto JPEG ou PNG.',
        });
      }

      const monitor = await MonitorProfile.findOne({ userId: req.user?.id })
        .select('+avatarData +avatarMimeType');
      if (!monitor) {
        return res.status(404).json({ message: 'Perfil de monitor não encontrado.' });
      }
      monitor.avatarMimeType = isPng ? 'image/png' : 'image/jpeg';
      monitor.avatarData = data;
      await monitor.save();

      return res.status(200).json({
        avatar: `data:${monitor.avatarMimeType};base64,${data.toString('base64')}`,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: 'Erro ao atualizar foto do perfil.',
        error: error.message,
      });
    }
  },

  async updateOwnInstitution(req: Request, res: Response) {
    try {
      const institutionId =
        typeof req.body?.institutionId === 'string'
          ? req.body.institutionId.trim()
          : '';
      if (!/^[0-9a-fA-F]{24}$/.test(institutionId)) {
        return res.status(400).json({ message: 'Selecione uma escola válida.' });
      }

      const [monitor, institution] = await Promise.all([
        MonitorProfile.findOne({ userId: req.user?.id }),
        Institution.findById(institutionId),
      ]);
      if (!monitor) {
        return res.status(404).json({ message: 'Perfil de monitor não encontrado.' });
      }
      if (!institution || institution.ativa === false) {
        return res.status(404).json({ message: 'Escola não encontrada ou inativa.' });
      }

      const [monitorLng, monitorLat] = monitor.location.coordinates;
      const [schoolLng, schoolLat] = institution.location.coordinates;
      const toRadians = (value: number) => (value * Math.PI) / 180;
      const latitudeDelta = toRadians(schoolLat - monitorLat);
      const longitudeDelta = toRadians(schoolLng - monitorLng);
      const a =
        Math.sin(latitudeDelta / 2) ** 2
        + Math.cos(toRadians(monitorLat))
          * Math.cos(toRadians(schoolLat))
          * Math.sin(longitudeDelta / 2) ** 2;
      const distanceKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      if (distanceKm > 25) {
        return res.status(400).json({
          message: 'A escola selecionada está fora do raio permitido de 25 km.',
        });
      }

      monitor.institutionId = institution._id;
      await monitor.save();
      return res.status(200).json({
        institutionId: String(institution._id),
        institutionName: institution.nome,
        distanceKm: Number(distanceKm.toFixed(1)),
      });
    } catch (error: any) {
      return res.status(500).json({
        message: 'Erro ao atualizar escola do monitor.',
        error: error.message,
      });
    }
  },

  // Criar Perfil de Monitor (Orquestrando MongoDB + Supabase)
  async create(req: Request, res: Response) {
    try {
      console.log('--- INÍCIO DO CADASTRO DE MONITOR COM AUTH ---');
      if (!supabaseAdmin) {
        return res.status(503).json({
          message: 'Cadastro de credenciais indisponível.',
          error:
            'Configure SUPABASE_SERVICE_ROLE_KEY no backend. A chave pública não pode criar usuários.',
        });
      }
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
      const { data: existingUser, error: existingUserError } = await supabaseAdmin
        .from('usuarios')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (existingUserError) {
        return res.status(502).json({
          message: 'Não foi possível verificar o e-mail no Supabase.',
          error: existingUserError.message,
        });
      }

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
        monitorLocation = {
          type: 'Point',
          coordinates: [...institution.location.coordinates],
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
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
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
      const { data: usuarioSupabase, error: supabaseTableError } = await supabaseAdmin
        .from('usuarios')
        .insert([
          { 
            id: authUserId, // ID do Supabase Auth
            email: email, 
            mongo_profile_id: mongoProfileId 
          }
        ])
        .select()
        .single();

      if (supabaseTableError) {
        console.error('Erro na tabela usuarios do Supabase. Executando rollback...', supabaseTableError);
        await supabaseAdmin.auth.admin.deleteUser(authUserId);
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
        mongoData: monitor,
        supabaseData: usuarioSupabase,
      });

    } catch (error: any) {
      console.error('Erro crítico no cadastro de monitor:', error);
      return res.status(500).json({ message: 'Erro ao criar perfil de monitor.', error: error.message });
    }
  },

  async listAll(_req: Request, res: Response) {
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
      const { lng, lat, maxDistanceInMeters, radiusKm, radius } = req.query;

      if (!lng || !lat) {
        return res.status(400).json({ message: 'Longitude (lng) e Latitude (lat) são obrigatórias.' });
      }

      const longitude = parseFloat(lng as string);
      const latitude = parseFloat(lat as string);
      const requestedRadiusKm = Number(radiusKm ?? radius ?? 25);
      const maxDistance = maxDistanceInMeters
        ? Number(maxDistanceInMeters)
        : requestedRadiusKm * 1000;

      if (
        !Number.isFinite(longitude) ||
        !Number.isFinite(latitude) ||
        longitude < -180 ||
        longitude > 180 ||
        latitude < -90 ||
        latitude > 90 ||
        !Number.isFinite(maxDistance) ||
        maxDistance <= 0
      ) {
        return res.status(400).json({
          message: 'Coordenadas ou raio de busca inválidos.',
        });
      }

      const monitors = await MonitorProfile.find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            $maxDistance: maxDistance,
          },
        },
      })
        .populate('institutionId', 'nome endereco')
        .lean();

      return res.status(200).json(monitors);
    } catch (error: any) {
      return res.status(500).json({ message: 'Erro na busca geoespacial.', error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      console.log('--- INÍCIO DA EXCLUSÃO DE MONITOR --- ID:', id);

      if (!supabaseAdmin) {
        return res.status(503).json({
          message: 'Operação indisponível.',
          error: 'Configure SUPABASE_SERVICE_ROLE_KEY no backend para gerenciar exclusões.',
        });
      }

      const monitor = await MonitorProfile.findById(id);
      if (!monitor) {
        return res.status(404).json({ message: 'Monitor não encontrado.' });
      }

      const authUserId = monitor.userId;

      // 1. Remove o registro correspondente na tabela 'usuarios' do Supabase
      const { error: supabaseError } = await supabaseAdmin!
        .from('usuarios')
        .delete()
        .eq('mongo_profile_id', id);

      if (supabaseError) {
        console.error('Erro ao excluir da tabela usuarios do Supabase:', supabaseError);
      }

      // 2. Deleta o usuário definitivamente do Supabase Auth usando o admin
      if (authUserId) {
        const { error: authDeleteError } = await supabaseAdmin!.auth.admin.deleteUser(authUserId);
        if (authDeleteError) {
          console.error('Erro ao excluir usuário do Supabase Auth:', authDeleteError);
        }
      }

      // 3. Deleta o perfil do monitor no MongoDB
      await MonitorProfile.findByIdAndDelete(id);

      console.log('Monitor excluído com sucesso de ambos os bancos e do Auth!');
      return res.status(200).json({ message: 'Monitor excluído com sucesso!' });
    } catch (error: any) {
      console.error('Erro crítico ao excluir monitor:', error);
      return res.status(500).json({ message: 'Erro ao excluir monitor.', error: error.message });
    }
  },
};
