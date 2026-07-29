import { NextFunction, Request, Response } from 'express';
import redisClient from '../config/redis';

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

    // Consulta rápida no Upstash Redis para validar a sessão
    const sessionData = await redisClient.get(`session:${token}`);

    if (!sessionData) {
      return res.status(401).json({
        message: 'Token JWT inválido ou expirado.',
      });
    }

    // Converte os dados salvos no Redis de volta para objeto
    const userData = JSON.parse(sessionData);

    // Injeta os dados do usuário na requisição para os controllers usarem
    req.user = {
      id: userData.userId,
      email: userData.email ?? null,
      name: userData.name ?? null,
      role: userData.role ?? null,
    };

    return next();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno ao validar autenticação.';
    return res.status(500).json({ message });
  }
}