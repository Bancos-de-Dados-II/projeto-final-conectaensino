import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

type CertificadoCreateBody = {
  mongo_monitor_id?: string;
  disciplina_id?: string;
  horas_validadas?: number;
};

export const CertificadoController = {
  async gerarCertificado(req: Request, res: Response): Promise<Response> {
    try {
      const body = req.body as CertificadoCreateBody;
      const mongoMonitorId = typeof body.mongo_monitor_id === 'string' ? body.mongo_monitor_id.trim() : '';
      const disciplinaId = typeof body.disciplina_id === 'string' ? body.disciplina_id.trim() : '';
      const horasValidadas = body.horas_validadas;

      if (!mongoMonitorId || !disciplinaId) {
        return res.status(400).json({ message: 'mongo_monitor_id e disciplina_id são obrigatórios.' });
      }

      if (!Number.isFinite(horasValidadas) || (horasValidadas ?? 0) <= 0) {
        return res.status(400).json({ message: 'horas_validadas deve ser um número maior que zero.' });
      }

      const { data, error } = await supabase
        .from('certificados')
        .insert({
          mongo_monitor_id: mongoMonitorId,
          disciplina_id: disciplinaId,
          horas_validadas: horasValidadas,
        })
        .select('id, mongo_monitor_id, disciplina_id, horas_validadas, emitido_em, created_at, updated_at')
        .single();

      if (error) {
        return res.status(400).json({ message: 'Erro ao gerar certificado.', error: error.message });
      }

      return res.status(201).json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro interno ao gerar certificado.';
      return res.status(500).json({ message });
    }
  },
};
