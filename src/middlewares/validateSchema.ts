import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodTypeAny } from 'zod';

const validateSource = (schema: ZodTypeAny, source: 'body' | 'query') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = source === 'query' ? req.query : req.body;
      const parsed = await schema.parseAsync(payload);

      if (source === 'query') {
        const requestWithQuery = req as unknown as { query: unknown };
        requestWithQuery.query = parsed;
      } else {
        req.body = parsed;
      }

      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: 'Erro na validação dos dados enviados.',
          errors: error.issues.map((issue) => ({
            campo: issue.path.join('.'),
            mensagem: issue.message,
          })),
        });
      }
      return res.status(500).json({ message: 'Erro interno no servidor.' });
    }
  };
};

export const validateSchema = (schema: ZodTypeAny) => validateSource(schema, 'body');

export const validateQuerySchema = (schema: ZodTypeAny) => validateSource(schema, 'query');