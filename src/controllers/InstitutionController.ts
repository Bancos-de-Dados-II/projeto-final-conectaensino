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
  async listAll(_req: Request, res: Response) {
    try {
      // Retorna todas as instituições para validação no front-end
      const institutions = await Institution.find({});
      return res.status(200).json(institutions);
    } catch (error: any) {
      return res.status(500).json({ message: 'Erro ao listar instituições.', error: error.message });
    }
  },

  async findNearby(req: Request, res: Response) {
    try {
      const longitude = Number(req.query.lng ?? req.query.longitude);
      const latitude = Number(req.query.lat ?? req.query.latitude);
      const radiusKm = Number(req.query.radiusKm ?? req.query.radius ?? 25);

      if (
        !Number.isFinite(longitude) ||
        !Number.isFinite(latitude) ||
        longitude < -180 ||
        longitude > 180 ||
        latitude < -90 ||
        latitude > 90 ||
        !Number.isFinite(radiusKm) ||
        radiusKm <= 0
      ) {
        return res.status(400).json({
          message: 'Coordenadas ou raio de busca inválidos.',
        });
      }

      const institutions = await Institution.find({
        ativa: true,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            $maxDistance: radiusKm * 1000,
          },
        },
      });

      return res.status(200).json(institutions);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Erro na busca geoespacial de instituições.',
        error: error.message,
      });
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
