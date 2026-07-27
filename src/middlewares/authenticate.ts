import { NextFunction, Request, Response } from 'express';
import { supabase } from '../config/supabase';

export type AuthenticatedUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: string | null;
};

function getBearerToken(authorization?: string): string | null {
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const token = getBearerToken(req.headers.authorization);

    if (!token) {
      return res.status(401).json({ message: 'Token ausente ou inválido.' });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        message: 'Token JWT inválido ou expirado.',
        error: error?.message,
      });
    }

    req.user = {
      id: data.user.id,
      email: data.user.email ?? null,
      name: (data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? null) as string | null,
      role: data.user.role ?? null,
    };

    return next();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno ao validar autenticação.';
    return res.status(500).json({ message });
  }
}