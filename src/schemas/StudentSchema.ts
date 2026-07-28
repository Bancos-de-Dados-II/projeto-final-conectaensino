import { z } from 'zod';

export const CreateMonitorSchema = z.object({
  name: z.string({ error: 'O nome é obrigatório.' }).min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  email: z.string({ error: 'O e-mail é obrigatório.' }).email('Formato de e-mail inválido.'),
  institutionId: z.string({ error: 'A instituição é obrigatória.' }).min(1, 'A instituição é obrigatória.'),
  disciplinas: z.array(z.string(), { error: 'Disciplinas são obrigatórias.' }).min(1, 'Informe pelo menos uma disciplina.'),
  disponibilidade: z.array(z.string(), { error: 'Disponibilidade é obrigatória.' }).min(1, 'Informe a disponibilidade.'),
  telefoneContato: z.string().optional(),
  enderecoResidencial: z
    .string({ error: 'Endereço residencial é obrigatório.' })
    .min(3, 'Endereço muito curto.'),
  location: z.object({
    type: z.literal('Point').default('Point'),
    coordinates: z
      .tuple(
        [
          z.number().min(-180).max(180), // Longitude
          z.number().min(-90).max(90),   // Latitude
        ],
        { error: 'Coordenadas [Longitude, Latitude] são obrigatórias.' }
      ),
  }),
});

export type CreateMonitorInput = z.infer<typeof CreateMonitorSchema>;