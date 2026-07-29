import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { Institution } from '../models/mongodb/Institution';
import { StudentProfile } from '../models/mongodb/StudentProfile';
import redisClient from '../config/redis';

export const AuthController = {
  async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body as { email?: string; password?: string };

      if (!email || !password) {
        return res.status(400).json({ message: 'email e password são obrigatórios.' });
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.session || !data.user) {
        return res.status(401).json({
          message: 'Credenciais inválidas.',
          error: error?.message,
        });
      }

      const accessToken = data.session.access_token;
      const expiresIn = data.session.expires_in || 7200;

      // Salvando a sessão no Upstash Redis
      await redisClient.setEx(
        `session:${accessToken}`,
        expiresIn,
        JSON.stringify({
          userId: data.user.id,
          email: data.user.email,
          role: data.user.role,
        })
      );

      return res.status(200).json({
        access_token: accessToken,
        refresh_token: data.session.refresh_token,
        token_type: data.session.token_type,
        expires_in: expiresIn,
        user: {
          id: data.user.id,
          email: data.user.email,
          role: data.user.user_metadata?.role ?? data.user.role,
          user_metadata: data.user.user_metadata,
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro interno ao autenticar usuário.';
      return res.status(500).json({ message });
    }
    
  },

  async logout(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice('Bearer '.length).trim();
        // Remove a sessão instantaneamente do Redis
        await redisClient.del(`session:${token}`);
      }

      return res.status(200).json({ message: 'Logout realizado com sucesso.' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro interno ao realizar logout.';
      return res.status(500).json({ message });
    }
  },

  async registerStudent(req: Request, res: Response): Promise<Response> {
    try {
      const {
        email,
        password,
        enderecoResidencial,
        necessidadesAcessibilidade,
        institutionId,
        latitude,
        longitude,
      } = req.body as {
        email?: string;
        password?: string;
        enderecoResidencial?: string;
        necessidadesAcessibilidade?: string;
        institutionId?: string;
        latitude?: number | string;
        longitude?: number | string;
      };

      if (!email || !password || !enderecoResidencial) {
        return res.status(400).json({ message: 'Preencha os campos obrigatórios (email, senha, endereço).' });
      }

      let institution = null;

      // Try to resolve institution by id if provided and looks like an ObjectId
      if (institutionId) {
        try {
          institution = await Institution.findById(institutionId);
        } catch (err) {
          // ignore cast errors - we'll fallback to coordinates if provided
          institution = null;
        }
      }

      // If institution not found, require latitude and longitude
      const lat = latitude !== undefined ? Number(latitude) : undefined;
      const lon = longitude !== undefined ? Number(longitude) : undefined;

      if (!institution && (lat === undefined || lon === undefined)) {
        return res.status(400).json({ message: 'Escola selecionada não encontrada e coordenadas não fornecidas.' });
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'student',
          },
        },
      });

      if (error) {
        return res.status(400).json({ message: 'Não foi possível criar a conta do aluno.', error: error.message });
      }

      const authUserId = data.user?.id;
      if (!authUserId) {
        return res.status(400).json({ message: 'A conta foi criada, mas não retornou um identificador de usuário.' });
      }

      const student = await StudentProfile.create({
        userId: authUserId,
        enderecoResidencial,
        tipoDeficiencia: '',
        necessidadesAcessibilidade: necessidadesAcessibilidade ?? '',
        location: {
          type: 'Point' as const,
          coordinates: institution
            ? institution.location.coordinates
            : [Number(lon), Number(lat)],
        },
      });

      const { data: usuarioSupabase, error: supabaseError } = await supabase
        .from('usuarios')
        .insert([
          {
            id: authUserId,
            email,
            mongo_profile_id: student._id.toString(),
          },
        ])
        .select()
        .single();

      if (supabaseError) {
        await StudentProfile.findByIdAndDelete(student._id);
        return res.status(400).json({ message: 'Erro ao salvar o cadastro no banco relacional.', error: supabaseError.message });
      }

      return res.status(201).json({
        message: 'Cadastro de aluno realizado com sucesso.',
        student,
        supabaseData: usuarioSupabase,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro interno ao cadastrar estudante.';
      return res.status(500).json({ message });
    }
  },
};
