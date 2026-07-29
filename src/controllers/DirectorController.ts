import { Request, Response } from 'express';
import { DirectorProfile } from '../models/mongodb/DirectorProfile';
import { Institution } from '../models/mongodb/Institution';
import { supabaseAdmin } from '../config/supabase';
import crypto from 'crypto';

export class DirectorController {
  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const { name, email, password, institutionId, cargo } = req.body;

      if (!email || !institutionId) {
        return res.status(400).json({ message: 'E-mail e o ID da instituição são obrigatórios.' });
      }

      const isMongoId = /^[0-9a-fA-F]{24}$/.test(institutionId);
      if (!isMongoId) {
        return res.status(400).json({ message: 'ID da instituição inválido.' });
      }

      const institution = await Institution.findById(institutionId);
      if (!institution) {
        return res.status(404).json({ message: 'Instituição não encontrada.' });
      }

      if (!supabaseAdmin) {
        return res.status(500).json({ message: 'Chave administrativa do Supabase não configurada no servidor.' });
      }

      const directorPassword = password || (crypto.randomBytes(6).toString('hex') + '!1A');
      const resolvedName = name || email.split('@')[0];

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: directorPassword,
        email_confirm: true,
        user_metadata: { name: resolvedName, role: 'director' }
      });

      if (authError) {
        return res.status(400).json({ message: authError.message, error: authError.message });
      }

      const authUserId = authData.user.id;

      const director = await (DirectorProfile.create as any)({
        userId: authUserId,
        institutionId,
        cargo: cargo || 'Diretor(a)'
      });

      const { data: usuarioSupabase, error: supabaseError } = await supabaseAdmin
        .from('usuarios')
        .insert([{ id: authUserId, email, mongo_profile_id: director._id.toString() }])
        .select()
        .single();

      if (supabaseError) {
        await supabaseAdmin.auth.admin.deleteUser(authUserId);
        await DirectorProfile.findByIdAndDelete(director._id);
        return res.status(400).json({ message: 'Erro de integridade relacional.', error: supabaseError.message });
      }

      return res.status(201).json({
        message: "Diretor cadastrado com sucesso!",
        email,
        mongoData: director,
        supabaseData: usuarioSupabase
      });

    } catch (error: any) {
      return res.status(500).json({ message: 'Erro interno ao cadastrar diretor.', error: error.message });
    }
  }
}