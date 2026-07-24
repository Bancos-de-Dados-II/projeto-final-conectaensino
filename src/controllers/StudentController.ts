import { Request, Response } from 'express';
import { StudentProfile } from '../models/mongodb/StudentProfile';

export class StudentController {
  // Criar Perfil de Estudante (Cadastrado pela Instituição)
  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const {
        userId,
        enderecoResidencial,
        tipoDeficiencia,
        necessidadesAcessibilidade,
        location,
      } = req.body;

      // Criação do perfil no MongoDB
      const student = await StudentProfile.create({
        userId,
        enderecoResidencial,
        tipoDeficiencia,
        necessidadesAcessibilidade,
        location,
      });

      return res.status(201).json(student);
    } catch (error: any) {
      return res.status(400).json({
        message: 'Erro ao cadastrar perfil do estudante.',
        error: error.message,
      });
    }
  }

  // Listar todos os estudantes
  static async listAll(_req: Request, res: Response): Promise<Response> {
    try {
      const students = await StudentProfile.find();
      return res.status(200).json(students);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Erro ao buscar estudantes.',
        error: error.message,
      });
    }
  }

  // Buscar perfil por userId (id do Supabase)
  static async getByUserId(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      const student = await StudentProfile.findOne({ userId });

      if (!student) {
        return res.status(404).json({ message: 'Estudante não encontrado.' });
      }

      return res.status(200).json(student);
    } catch (error: any) {
      return res.status(500).json({
        message: 'Erro ao buscar estudante.',
        error: error.message,
      });
    }
  }
}