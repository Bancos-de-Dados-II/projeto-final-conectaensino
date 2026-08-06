import { Request, Response } from 'express';
import { Institution } from '../models/mongodb/Institution';
import { MonitorProfile } from '../models/mongodb/MonitorProfile';

export const InstitutionController = {
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

  async listAll(_req: Request, res: Response) {
    try {
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
      }).lean();

      const institutionIds = institutions.map((institution) => institution._id);
      const institutionMonitors = institutionIds.length
        ? await MonitorProfile.find({
            institutionId: { $in: institutionIds },
            ativo: true,
          }).select('institutionId disciplinas').lean()
        : [];
      const monitorCountByInstitution = new Map<string, number>();
      const monitorSubjectsByInstitution = new Map<string, Set<string>>();
      for (const monitor of institutionMonitors) {
        const institutionId = String(monitor.institutionId);
        monitorCountByInstitution.set(
          institutionId,
          (monitorCountByInstitution.get(institutionId) ?? 0) + 1,
        );
        const subjects = monitorSubjectsByInstitution.get(institutionId) ?? new Set<string>();
        for (const subject of monitor.disciplinas ?? []) {
          const normalized = subject.trim();
          if (normalized) subjects.add(normalized);
        }
        monitorSubjectsByInstitution.set(institutionId, subjects);
      }

      const institutionsWithMonitorCount = institutions.map((institution) => ({
        ...institution,
        monitorCount:
          monitorCountByInstitution.get(String(institution._id)) ?? 0,
        monitorSubjects: [
          ...(monitorSubjectsByInstitution.get(String(institution._id)) ?? []),
        ].sort((first, second) => first.localeCompare(second, 'pt-BR')),
      }));

      return res.status(200).json(institutionsWithMonitorCount);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Erro na busca geoespacial de instituições.',
        error: error.message,
      });
    }
  },

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
