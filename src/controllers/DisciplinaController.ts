import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { SubjectSuggestion } from '../models/mongodb/SubjectSuggestion';

const BASIC_SUBJECTS = [
  'Artes',
  'Biologia',
  'Ciências',
  'Educação Física',
  'Filosofia',
  'Física',
  'Geografia',
  'História',
  'Inglês',
  'Língua Portuguesa',
  'Matemática',
  'Química',
  'Sociologia',
];

function normalizeSubject(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
}

type DisciplinaCreateBody = {
  nome?: string;
  carga_horaria?: number;
};

type VincularUsuarioBody = {
  usuario_id?: string;
  disciplina_id?: string;
};

export const DisciplinaController = {
  async catalog(_req: Request, res: Response): Promise<Response> {
    try {
      const approved = await SubjectSuggestion.find({ status: 'approved' })
        .select('name')
        .sort({ name: 1 })
        .lean();
      const names = [...new Set([...BASIC_SUBJECTS, ...approved.map((item) => item.name)])]
        .sort((first, second) => first.localeCompare(second, 'pt-BR'));
      return res.status(200).json(names);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar catálogo.';
      return res.status(500).json({ message });
    }
  },

  async suggest(req: Request, res: Response): Promise<Response> {
    try {
      const name = typeof req.body?.name === 'string' ? req.body.name.trim().slice(0, 80) : '';
      if (name.length < 2) return res.status(400).json({ message: 'Informe uma disciplina válida.' });
      const normalizedName = normalizeSubject(name);
      const isBasic = BASIC_SUBJECTS.some((subject) => normalizeSubject(subject) === normalizedName);
      const existing = await SubjectSuggestion.findOne({ normalizedName, status: { $in: ['pending', 'approved'] } }).lean();
      if (isBasic || existing) return res.status(409).json({ message: 'Esta disciplina já existe ou aguarda aprovação.' });
      const suggestion = await SubjectSuggestion.create({
        name,
        normalizedName,
        suggestedBy: req.user?.id,
        suggestedByRole: req.user?.role ?? 'authenticated',
      });
      return res.status(201).json(suggestion);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao enviar sugestão.';
      return res.status(500).json({ message });
    }
  },

  async listSuggestions(_req: Request, res: Response): Promise<Response> {
    try {
      const suggestions = await SubjectSuggestion.find({}).sort({ status: 1, createdAt: -1 }).lean();
      return res.status(200).json(suggestions);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao listar sugestões.';
      return res.status(500).json({ message });
    }
  },

  async reviewSuggestion(req: Request, res: Response): Promise<Response> {
    try {
      const status = req.body?.status;
      if (status !== 'approved' && status !== 'rejected') {
        return res.status(400).json({ message: 'Decisão inválida.' });
      }
      const suggestion = await SubjectSuggestion.findByIdAndUpdate(
        req.params.id,
        { status, reviewedBy: req.user?.id, reviewedAt: new Date() },
        { new: true },
      );
      if (!suggestion) return res.status(404).json({ message: 'Sugestão não encontrada.' });
      return res.status(200).json(suggestion);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao revisar sugestão.';
      return res.status(500).json({ message });
    }
  },
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

      const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('id', usuarioId)
        .maybeSingle();

      if (usuarioError) {
        return res.status(400).json({ message: 'Erro ao validar usuário.', error: usuarioError.message });
      }

      if (!usuario) {
        return res.status(404).json({ message: 'Usuário não encontrado.' });
      }

      const { data: disciplina, error: disciplinaError } = await supabase
        .from('disciplinas')
        .select('id')
        .eq('id', disciplinaId)
        .maybeSingle();

      if (disciplinaError) {
        return res.status(400).json({ message: 'Erro ao validar disciplina.', error: disciplinaError.message });
      }

      if (!disciplina) {
        return res.status(404).json({ message: 'Disciplina não encontrada.' });
      }

      const { data, error } = await supabase
        .from('usuario_disciplina')
        .insert({ usuario_id: usuarioId, disciplina_id: disciplinaId })
        .select('usuario_id, disciplina_id')
        .single();

      if (error) {
        const status = error.code === '23505' ? 409 : 400;
        return res.status(status).json({ message: 'Erro ao vincular usuário à disciplina.', error: error.message });
      }

      return res.status(201).json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro interno ao vincular usuário à disciplina.';
      return res.status(500).json({ message });
    }
  },
};
