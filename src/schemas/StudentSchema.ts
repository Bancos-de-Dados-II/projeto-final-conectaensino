import { z } from 'zod';

export const CreateStudentSchema = z.object({
  name: z.string({ error: 'O nome é obrigatório.' }).min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  email: z.string({ error: 'O e-mail é obrigatório.' }).email('Formato de e-mail inválido.'),
  password: z.string({ error: 'A senha é obrigatória.' }).min(6, 'A senha deve ter pelo menos 6 caracteres.').optional(),
  institutionId: z.string({ error: 'A instituição próxima é obrigatória.' }).min(1, 'A instituição próxima é obrigatória.'),
  tipoDeficiencia: z.string({ error: 'O tipo de deficiência é obrigatório.' }),
  necessidadesAcessibilidade: z.string().optional(),
  enderecoResidencial: z.string({ error: 'Endereço residencial é obrigatório.' }).min(3, 'Endereço muito curto.'),
  location: z.object({
    type: z.literal('Point').default('Point'),
    coordinates: z.tuple(
      [
        z.number().min(-180).max(180), // Longitude
        z.number().min(-90).max(90),   // Latitude
      ],
      { error: 'Coordenadas [Longitude, Latitude] são obrigatórias.' }
    ),
  }),
});

export type CreateStudentInput = z.infer<typeof CreateStudentSchema>;