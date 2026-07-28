import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string({ error: 'O e-mail é obrigatório.' }).email('Formato de e-mail inválido.'),
  password: z.string({ error: 'A senha é obrigatória.' }).min(1, 'A senha é obrigatória.'),
});

export const RegisterStudentSchema = z
  .object({
    email: z.string({ error: 'O e-mail é obrigatório.' }).email('Formato de e-mail inválido.'),
    password: z
      .string({ error: 'A senha é obrigatória.' })
      .min(6, 'A senha deve possuir pelo menos 6 caracteres.'),
    enderecoResidencial: z
      .string({ error: 'O endereço residencial é obrigatório.' })
      .min(5, 'Endereço residencial muito curto.'),
    necessidadesAcessibilidade: z.string().optional(),
    institutionId: z.string().min(1).optional(),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
  })
  .superRefine((data, context) => {
    const hasCoordinates =
      data.latitude !== undefined && data.longitude !== undefined;

    if (!data.institutionId && !hasCoordinates) {
      context.addIssue({
        code: 'custom',
        path: ['institutionId'],
        message: 'Informe uma instituição ou coordenadas válidas.',
      });
    }
  });

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterStudentInput = z.infer<typeof RegisterStudentSchema>;
