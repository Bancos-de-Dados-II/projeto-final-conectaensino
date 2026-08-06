import cron from 'node-cron';
import { supabase } from '../config/supabase';
import { Session } from '../models/mongodb/Session';
import { MonitorProfile } from '../models/mongodb/MonitorProfile';

function startOfPreviousMonth(now = new Date()): Date {
  const year = now.getFullYear();
  const month = now.getMonth();
  return new Date(year, month - 1, 1, 0, 0, 0, 0);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1, 0, 0, 0, 0);
}

export async function generateMonthlyCertificatesForPreviousMonth(dryRun = false): Promise<void> {
  const monthStart = startOfPreviousMonth();
  const monthEnd = endOfMonth(monthStart);

  console.log(`Gerando certificados (rotina) para ${monthStart.toISOString()} - ${monthEnd.toISOString()}`);

  const groups = await Session.aggregate([
    { $match: { status: 'finalizada', dataHora: { $gte: monthStart, $lt: monthEnd } } },
    { $group: { _id: { monitorId: '$monitorId', disciplinaId: '$disciplinaId' }, count: { $sum: 1 } } },
  ]).exec();

  for (const group of groups) {
    const monitorId = group._id.monitorId;
    const disciplinaId = group._id.disciplinaId;
    const sessionCount = group.count ?? 0;
    const HOURS_PER_SESSION = Number(process.env.HOURS_PER_SESSION) || 1;
    const totalHours = sessionCount * HOURS_PER_SESSION;

    if (!monitorId || !disciplinaId || totalHours <= 0) continue;

    const monitor = await MonitorProfile.findOne({ userId: monitorId, ativo: true }).lean();
    if (!monitor) {
      console.log(`Monitor ${monitorId} não encontrado ou inativo — pulando.`);
      continue;
    }

    // verifica duplicata no Supabase
    const { data: existing, error: queryError } = await supabase
      .from('certificados')
      .select('id, created_at')
      .eq('mongo_monitor_id', monitorId)
      .eq('disciplina_id', disciplinaId)
      .gte('created_at', monthStart.toISOString())
      .lt('created_at', monthEnd.toISOString())
      .limit(1);

    if (queryError) {
      console.error('Erro ao consultar certificados existentes:', queryError.message);
      continue;
    }

    if (Array.isArray(existing) && existing.length > 0) {
      console.log(`Certificado já existente para monitor=${monitorId} disciplina=${disciplinaId} no mês.`);
      continue;
    }

    const payload = {
      mongo_monitor_id: monitorId,
      disciplina_id: disciplinaId,
      horas_validadas: totalHours,
      emitido_em: new Date().toISOString(),
    };

    if (dryRun) {
      console.log('DRY RUN - payload:', payload);
      continue;
    }

    const { data, error } = await supabase.from('certificados').insert([payload]).select().single();

    if (error) {
      console.error('Erro ao inserir certificado:', error.message);
      continue;
    }

    console.log(`Certificado criado: monitor=${monitorId} disciplina=${disciplinaId} horas=${totalHours}`);
  }

  console.log('Geração de certificados concluída.');
}

export function scheduleMonthlyCertificates(): void {
  const cronExpr = process.env.CERTIFICATES_CRON || '0 0 1 * *';
  const timezone = process.env.TIMEZONE || 'UTC';

  console.log(`Agendando geração mensal de certificados com expressão '${cronExpr}' (tz=${timezone})`);

  cron.schedule(cronExpr, async () => {
    try {
      await generateMonthlyCertificatesForPreviousMonth(false);
    } catch (err) {
      console.error('Erro na tarefa agendada de certificados:', err);
    }
  }, { timezone });
}
