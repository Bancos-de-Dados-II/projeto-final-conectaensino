import { Request, Response } from 'express';
import { MonitorProfile } from '../models/mongodb/MonitorProfile';

export const getNearMonitors = async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius = 5000, subject_id } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: "Parâmetros lat e lng são obrigatórios." });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const maxDistanceInMeters = parseInt(radius as string);

    // Filtro base de localização
    const query: any = {
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude] // [lng, lat]
          },
          $maxDistance: maxDistanceInMeters
        }
      }
    };

    // Filtra por disciplina, se informada
    if (subject_id) {
      query.disciplinasAtendidas = subject_id;
    }

    const monitorsNear = await MonitorProfile.find(query);

    return res.status(200).json(monitorsNear);
  } catch (error) {
    console.error("Erro na busca espacial:", error);
    return res.status(500).json({ error: "Erro ao processar consulta espacial no MongoDB." });
  }
};