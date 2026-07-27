import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

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

      return res.status(200).json({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        token_type: data.session.token_type,
        expires_in: data.session.expires_in,
        user: {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,
          user_metadata: data.user.user_metadata,
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro interno ao autenticar usuário.';
      return res.status(500).json({ message });
    }
  },
};