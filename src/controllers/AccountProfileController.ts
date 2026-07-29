import { Request, Response } from 'express';
import { DirectorProfile } from '../models/mongodb/DirectorProfile';
import { Institution } from '../models/mongodb/Institution';
import { MonitorProfile } from '../models/mongodb/MonitorProfile';
import { StudentProfile } from '../models/mongodb/StudentProfile';
import { supabaseAdmin } from '../config/supabase';

function distanceKm(a: [number, number], b: [number, number]): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const [aLng, aLat] = a;
  const [bLng, bLat] = b;
  const latitudeDelta = toRadians(bLat - aLat);
  const longitudeDelta = toRadians(bLng - aLng);
  const value =
    Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(toRadians(aLat))
      * Math.cos(toRadians(bLat))
      * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function parseAvatar(value: unknown) {
  const content = typeof value === 'string' ? value : '';
  const data = Buffer.from(content.replace(/^data:[^;]+;base64,/, ''), 'base64');
  const isJpeg =
    data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  const pngSignature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  const isPng = data.subarray(0, 8).equals(pngSignature);
  return {
    data,
    mimeType: isPng ? 'image/png' as const : isJpeg ? 'image/jpeg' as const : null,
  };
}

export const AccountProfileController = {
  async get(req: Request, res: Response): Promise<Response> {
    try {
      const role = req.user?.role?.toLocaleLowerCase('pt-BR');
      const profile =
        role === 'monitor'
          ? await MonitorProfile.findOne({ userId: req.user?.id })
              .select('+avatarData +avatarMimeType')
              .populate('institutionId', 'nome endereco location')
              .lean()
          : role === 'director'
          ? await DirectorProfile.findOne({ userId: req.user?.id })
              .select('+avatarData +avatarMimeType')
              .populate('institutionId', 'nome endereco location')
              .lean()
          : await StudentProfile.findOne({ userId: req.user?.id })
              .select('+avatarData +avatarMimeType')
              .populate('institutionId', 'nome endereco location')
              .lean();
      if (!profile) return res.status(404).json({ message: 'Perfil não encontrado.' });

      const avatar =
        profile.avatarData && profile.avatarMimeType
          ? `data:${profile.avatarMimeType};base64,${profile.avatarData.toString('base64')}`
          : undefined;
      const { avatarData: _avatarData, ...safeProfile } = profile;
      return res.status(200).json({ ...safeProfile, avatar });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar perfil.';
      return res.status(500).json({ message });
    }
  },

  async update(req: Request, res: Response): Promise<Response> {
    try {
      const clean = (value: unknown, maxLength: number) =>
        typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
      const name = clean(req.body?.name, 120);
      const email = clean(req.body?.email, 254).toLocaleLowerCase('pt-BR');
      const phone = clean(req.body?.phone, 30);
      const course = clean(req.body?.course, 120);
      const specialty = clean(req.body?.specialty, 120);

      if (!name) {
        return res.status(400).json({ message: 'Informe o nome do perfil.' });
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: 'Informe um e-mail válido.' });
      }

      const userId = req.user?.id;
      const role = req.user?.role?.toLocaleLowerCase('pt-BR');
      let matched = false;
      if (role === 'monitor') {
        const result = await MonitorProfile.updateOne(
          { userId },
          { $set: { name, email, telefoneContato: phone, course } },
        );
        matched = result.matchedCount > 0;
      } else if (role === 'director') {
        const result = await DirectorProfile.updateOne(
          { userId },
          { $set: { name, email, phone } },
        );
        matched = result.matchedCount > 0;
      } else {
        const result = await StudentProfile.updateOne(
          { userId },
          { $set: { name, email, phone, tipoDeficiencia: specialty } },
        );
        matched = result.matchedCount > 0;
      }

      if (!matched) {
        return res.status(404).json({ message: 'Perfil não encontrado.' });
      }

      if (supabaseAdmin && userId) {
        const attributes: {
          email?: string;
          user_metadata: { name: string };
        } = { user_metadata: { name } };
        if (email && email !== req.user?.email) attributes.email = email;
        const { error } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          attributes,
        );
        if (error) {
          return res.status(400).json({
            message: 'Os dados foram salvos, mas não foi possível atualizar as credenciais.',
            error: error.message,
          });
        }
      }

      return res.status(200).json({
        message: 'Perfil atualizado com sucesso.',
        profile: {
          name,
          email,
          phone,
          course: role === 'monitor' ? course : undefined,
          specialty: role !== 'monitor' && role !== 'director'
            ? specialty
            : undefined,
        },
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao atualizar perfil.';
      return res.status(500).json({ message });
    }
  },

  async password(req: Request, res: Response): Promise<Response> {
    try {
      const newPassword =
        typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
      const confirmPassword =
        typeof req.body?.confirmPassword === 'string'
          ? req.body.confirmPassword
          : '';
      if (newPassword.length < 8) {
        return res.status(400).json({
          message: 'A nova senha deve possuir pelo menos 8 caracteres.',
        });
      }
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'As senhas não coincidem.' });
      }
      if (!supabaseAdmin || !req.user?.id) {
        return res.status(503).json({
          message: 'Atualização de senha indisponível no servidor.',
        });
      }

      const [monitor, student] = await Promise.all([
        MonitorProfile.findOne({ userId: req.user.id }),
        StudentProfile.findOne({ userId: req.user.id }),
      ]);
      const profile = monitor ?? student;
      if (!profile || profile.mustChangePassword !== true) {
        return res.status(403).json({
          message: 'Esta conta não possui troca obrigatória de senha pendente.',
        });
      }

      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        req.user.id,
        { password: newPassword },
      );
      if (error) {
        return res.status(400).json({
          message: 'Não foi possível atualizar a senha.',
          error: error.message,
        });
      }
      profile.mustChangePassword = false;
      await profile.save();
      return res.status(200).json({ message: 'Senha atualizada com sucesso.' });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao atualizar senha.';
      return res.status(500).json({ message });
    }
  },

  async avatar(req: Request, res: Response): Promise<Response> {
    try {
      const parsed = parseAvatar(req.body?.contentBase64);
      if (!parsed.data.length || parsed.data.length > 2 * 1024 * 1024) {
        return res.status(400).json({ message: 'A foto deve possuir no máximo 2 MB.' });
      }
      if (!parsed.mimeType) {
        return res.status(400).json({ message: 'Envie uma foto JPEG ou PNG.' });
      }
      const role = req.user?.role?.toLocaleLowerCase('pt-BR');
      const profile =
        role === 'director'
          ? await DirectorProfile.findOne({ userId: req.user?.id })
              .select('+avatarData +avatarMimeType')
          : await StudentProfile.findOne({ userId: req.user?.id })
              .select('+avatarData +avatarMimeType');
      if (!profile) return res.status(404).json({ message: 'Perfil não encontrado.' });
      profile.avatarData = parsed.data;
      profile.avatarMimeType = parsed.mimeType;
      await profile.save();
      return res.status(200).json({
        avatar: `data:${parsed.mimeType};base64,${parsed.data.toString('base64')}`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar foto.';
      return res.status(500).json({ message });
    }
  },

  async institution(req: Request, res: Response): Promise<Response> {
    try {
      const institutionId =
        typeof req.body?.institutionId === 'string' ? req.body.institutionId : '';
      if (!/^[0-9a-fA-F]{24}$/.test(institutionId)) {
        return res.status(400).json({ message: 'Selecione uma escola válida.' });
      }
      const role = req.user?.role?.toLocaleLowerCase('pt-BR');
      const target = await Institution.findById(institutionId);
      if (!target || target.ativa === false) {
        return res.status(404).json({ message: 'Escola não encontrada ou inativa.' });
      }

      if (role === 'director') {
        const profile = await DirectorProfile.findOne({ userId: req.user?.id });
        if (!profile) return res.status(404).json({ message: 'Perfil não encontrado.' });
        const current = await Institution.findById(profile.institutionId);
        if (!current) return res.status(404).json({ message: 'Escola atual não encontrada.' });
        const distance = distanceKm(
          current.location.coordinates,
          target.location.coordinates,
        );
        if (distance > 25) {
          return res.status(400).json({ message: 'A escola está fora do raio de 25 km.' });
        }
        profile.institutionId = target._id;
        await profile.save();
        return res.status(200).json({
          institutionName: target.nome,
          distanceKm: Number(distance.toFixed(1)),
        });
      }

      const profile = await StudentProfile.findOne({ userId: req.user?.id });
      if (!profile) return res.status(404).json({ message: 'Perfil não encontrado.' });
      const distance = distanceKm(profile.location.coordinates, target.location.coordinates);
      if (distance > 25) {
        return res.status(400).json({ message: 'A escola está fora do raio de 25 km.' });
      }
      profile.institutionId = target._id;
      await profile.save();
      return res.status(200).json({
        institutionName: target.nome,
        distanceKm: Number(distance.toFixed(1)),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar escola.';
      return res.status(500).json({ message });
    }
  },
};
