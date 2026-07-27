import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string({ error: 'O e-mail é obrigatório.' }).email('Formato de e-mail inválido.'),
  password: z.string({ error: 'A senha é obrigatória.' }).min(1, 'A senha é obrigatória.'),
});

export type LoginInput = z.infer<typeof LoginSchema>;