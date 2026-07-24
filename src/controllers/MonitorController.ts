import { Request, Response } from 'express';
import { MonitorProfile } from '../models/mongodb/MonitorProfile';

export const MonitorController = {
  async create(req: Request, res: Response) {
    try {
      const monitor = await MonitorProfile.create(req.body);
      return res.status(201).json(monitor);
    } catch (error: any) {
      return res.status(500).json({ message: 'Erro ao criar perfil de monitor.', error: error.message });
    }
  },

  async listAll(req: Request, res: Response) {
    try {
      // Popula o ID da instituição com o objeto da escola
      const monitors = await MonitorProfile.find().populate('institutionId', 'nome cnpj endereco');
      return res.status(200).json(monitors);
    } catch (error: any) {
      return res.status(500).json({ message: 'Erro ao listar monitores.', error: error.message });
    }
  },

  async getByUserId(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const monitor = await MonitorProfile.findOne({ userId }).populate('institutionId');

      if (!monitor) {
        return res.status(404).json({ message: 'Monitor não encontrado.' });
      }

      return res.status(200).json(monitor);
    } catch (error: any) {
      return res.status(500).json({ message: 'Erro ao buscar monitor.', error: error.message });
    }
  },

  // Buscar monitores de uma instituição específica
  async getByInstitution(req: Request, res: Response) {
    try {
      const { institutionId } = req.params;
      const monitors = await MonitorProfile.find({ institutionId }).populate('institutionId');
      return res.status(200).json(monitors);
    } catch (error: any) {
      return res.status(500).json({ message: 'Erro ao buscar monitores da instituição.', error: error.message });
    }
  },

  async findNearby(req: Request, res: Response) {
    try {
      const { lng, lat, maxDistanceInMeters } = req.query;

      if (!lng || !lat) {
        return res.status(400).json({ message: 'Longitude (lng) e Latitude (lat) são obrigatórias.' });
      }

      const longitude = parseFloat(lng as string);
      const latitude = parseFloat(lat as string);
      const maxDistance = maxDistanceInMeters ? parseInt(maxDistanceInMeters as string) : 5000;

      const monitors = await MonitorProfile.find({
        ativo: true,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            $maxDistance: maxDistance,
          },
        },
      }).populate('institutionId', 'nome endereco');

      return res.status(200).json(monitors);
    } catch (error: any) {
      return res.status(500).json({ message: 'Erro na busca geoespacial.', error: error.message });
    }
  },
};