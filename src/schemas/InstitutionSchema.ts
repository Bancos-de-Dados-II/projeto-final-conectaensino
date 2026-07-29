import { z } from 'zod';

export const CreateInstitutionSchema = z.object({
  nome: z
    .string({ error: 'Nome da instituição é obrigatório.' })
    .min(3, 'Nome deve ter no mínimo 3 caracteres.'),
  cnpj: z.string().optional(),
  codigoInep: z.string().optional(),
  diretorResponsavel: z.object({
    nome: z.string({ error: 'Nome do diretor é obrigatório.' }),
    email: z.string().email('E-mail do diretor inválido.'),
    telefone: z.string({ error: 'Telefone do diretor é obrigatório.' }),
  }),
  endereco: z
    .string({ error: 'Endereço é obrigatório.' })
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
  ativa: z.boolean().optional().default(true),
});

export type CreateInstitutionInput = z.infer<typeof CreateInstitutionSchema>;