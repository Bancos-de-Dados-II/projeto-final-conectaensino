import { z } from 'zod';

export const CreateMonitorSchema = z.object({
  userId: z.string({ error: 'userId é obrigatório.' }),
  institutionId: z.string({ error: 'institutionId é obrigatório.' }),
  email: z.string({ error: 'E-mail é obrigatório.' }).email('E-mail inválido.'), // 👈 Adicionado aqui
  disciplinas: z
    .array(z.string(), { error: 'Informe ao menos uma disciplina.' })
    .min(1, 'Informe pelo menos uma disciplina.'),
  disponibilidade: z
    .array(z.string(), { error: 'Informe a disponibilidade.' })
    .min(1, 'Informe pelo menos um horário de disponibilidade.'),
  telefoneContato: z.string().optional(),
  enderecoResidencial: z
    .string({ error: 'Endereço residencial é obrigatório.' })
    .min(5, 'Endereço muito curto.'),
  location: z.object({
    type: z.literal('Point').default('Point'),
    coordinates: z.tuple(
      [
        z.number().min(-180).max(180),
        z.number().min(-90).max(90),
      ],
      { error: 'Coordenadas [Longitude, Latitude] são obrigatórias.' }
    ),
  }),
});

export type CreateMonitorInput = z.infer<typeof CreateMonitorSchema>;