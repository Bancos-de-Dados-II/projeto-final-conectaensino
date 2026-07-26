import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

type AvaliacaoCreateBody = {
  mongo_avaliador_id?: string;
  mongo_avaliado_id?: string;
  nota?: number;
  comentario?: string | null;
};

export const AvaliacaoController = {
  async create(req: Request, res: Response): Promise<Response> {
    try {
      const body = req.body as AvaliacaoCreateBody;
      const mongoAvaliadorId = typeof body.mongo_avaliador_id === 'string' ? body.mongo_avaliador_id.trim() : '';
      const mongoAvaliadoId = typeof body.mongo_avaliado_id === 'string' ? body.mongo_avaliado_id.trim() : '';
      const nota = body.nota;
      const comentario = typeof body.comentario === 'string' ? body.comentario.trim() : body.comentario ?? null;

      if (!mongoAvaliadorId || !mongoAvaliadoId) {
        return res.status(400).json({ message: 'mongo_avaliador_id e mongo_avaliado_id são obrigatórios.' });
      }

      if (!Number.isInteger(nota) || (nota ?? 0) < 1 || (nota ?? 0) > 5) {
        return res.status(400).json({ message: 'A nota deve ser um inteiro entre 1 e 5.' });
      }

      const { data, error } = await supabase
        .from('avaliacoes')
        .insert({
          mongo_avaliador_id: mongoAvaliadorId,
          mongo_avaliado_id: mongoAvaliadoId,
          nota,
          comentario,
        })
        .select('id, mongo_avaliador_id, mongo_avaliado_id, nota, comentario, created_at, updated_at')
        .single();

      if (error) {
        return res.status(400).json({ message: 'Erro ao criar avaliação.', error: error.message });
      }

      return res.status(201).json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro interno ao criar avaliação.';
      return res.status(500).json({ message });
    }
  },
};
