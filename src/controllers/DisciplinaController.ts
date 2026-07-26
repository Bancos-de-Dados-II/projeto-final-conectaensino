import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

type DisciplinaCreateBody = {
  nome?: string;
  carga_horaria?: number;
};

type VincularUsuarioBody = {
  usuario_id?: string;
  disciplina_id?: string;
};

export const DisciplinaController = {
  async create(req: Request, res: Response): Promise<Response> {
    try {
      const body = req.body as DisciplinaCreateBody;
      const nome = typeof body.nome === 'string' ? body.nome.trim() : '';
      const cargaHoraria = body.carga_horaria;

      if (!nome) {
        return res.status(400).json({ message: 'O campo nome é obrigatório.' });
      }

      if (!Number.isInteger(cargaHoraria) || (cargaHoraria ?? 0) <= 0) {
        return res.status(400).json({ message: 'O campo carga_horaria deve ser um inteiro maior que zero.' });
      }

      const { data, error } = await supabase
        .from('disciplinas')
        .insert({ nome, carga_horaria: cargaHoraria })
        .select('id, nome, carga_horaria')
        .single();

      if (error) {
        return res.status(400).json({ message: 'Erro ao criar disciplina.', error: error.message });
      }

      return res.status(201).json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro interno ao criar disciplina.';
      return res.status(500).json({ message });
    }
  },

  async listAll(_req: Request, res: Response): Promise<Response> {
    try {
      const { data, error } = await supabase
        .from('disciplinas')
        .select('id, nome, carga_horaria, created_at, updated_at')
        .order('nome', { ascending: true });

      if (error) {
        return res.status(500).json({ message: 'Erro ao listar disciplinas.', error: error.message });
      }

      return res.status(200).json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro interno ao listar disciplinas.';
      return res.status(500).json({ message });
    }
  },

  async vincularUsuario(req: Request, res: Response): Promise<Response> {
    try {
      const body = req.body as VincularUsuarioBody;
      const usuarioId = typeof body.usuario_id === 'string' ? body.usuario_id.trim() : '';
      const disciplinaId = typeof body.disciplina_id === 'string' ? body.disciplina_id.trim() : '';

      if (!usuarioId || !disciplinaId) {
        return res.status(400).json({ message: 'usuario_id e disciplina_id são obrigatórios.' });
      }

      const { data, error } = await supabase
        .from('usuario_disciplina')
        .insert({ usuario_id: usuarioId, disciplina_id: disciplinaId })
        .select('usuario_id, disciplina_id')
        .single();

      if (error) {
        return res.status(400).json({ message: 'Erro ao vincular usuário à disciplina.', error: error.message });
      }

      return res.status(201).json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro interno ao vincular usuário à disciplina.';
      return res.status(500).json({ message });
    }
  },
};
