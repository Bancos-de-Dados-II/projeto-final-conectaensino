import { z } from 'zod';

export const CreateStudentSchema = z.object({
  userId: z.string({ error: 'userId é obrigatório.' }),
  enderecoResidencial: z
    .string({ error: 'Endereço residencial é obrigatório.' })
    .min(5, 'Endereço muito curto.'),
  tipoDeficiencia: z.string({
    error: 'Tipo de deficiência é obrigatório.',
  }),
  necessidadesAcessibilidade: z.string().optional(),
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

export type CreateStudentInput = z.infer<typeof CreateStudentSchema>;