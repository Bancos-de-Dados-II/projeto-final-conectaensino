import { Request, Response } from 'express';
import { Institution } from '../models/mongodb/Institution';

export const InstitutionController = {
  // Cadastrar nova Instituição
  async create(req: Request, res: Response) {
    try {
      const institution = await Institution.create(req.body);
      return res.status(201).json(institution);
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: 'Erro ao cadastrar instituição.', error: error.message });
    }
  },

  // Listar todas as Instituições
  async listAll(req: Request, res: Response) {
    try {
      const institutions = await Institution.find();
      return res.status(200).json(institutions);
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: 'Erro ao listar instituições.', error: error.message });
    }
  },

  // Buscar Instituição por ID
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const institution = await Institution.findById(id);

      if (!institution) {
        return res.status(404).json({ message: 'Instituição não encontrada.' });
      }

      return res.status(200).json(institution);
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: 'Erro ao buscar instituição.', error: error.message });
    }
  },
};