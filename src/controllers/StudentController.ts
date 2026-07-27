import { Request, Response } from 'express';
import { StudentProfile } from '../models/mongodb/StudentProfile';
import { supabase } from '../config/supabase';
import type { GeoSearchQuery } from '../schemas/GeoSearchSchema';

type StudentGeoDTO = {
  id: string;
  userId: string;
  tipoDeficiencia: string;
  necessidadesAcessibilidade: string;
  enderecoResidencial: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
};

function toStudentGeoDTO(student: {
  _id: unknown;
  userId: string;
  tipoDeficiencia: string;
  necessidadesAcessibilidade: string;
  enderecoResidencial: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
}): StudentGeoDTO {
  return {
    id: String(student._id),
    userId: student.userId,
    tipoDeficiencia: student.tipoDeficiencia,
    necessidadesAcessibilidade: student.necessidadesAcessibilidade,
    enderecoResidencial: student.enderecoResidencial,
    location: {
      type: 'Point',
      coordinates: [student.location.coordinates[0], student.location.coordinates[1]],
    },
  };
}

export class StudentController {
  // Criar Perfil de Estudante (Orquestrando MongoDB + Supabase)
  static async create(req: Request, res: Response): Promise<Response> {
    try {
      // ESPIÃO: Vamos ver exatamente o que está chegando na API!
      console.log(" DADOS RECEBIDOS NO BODY:", req.body);

      const {
        userId,
        email, 
        enderecoResidencial,
        tipoDeficiencia,
        necessidadesAcessibilidade,
        location,
      } = req.body;

      // 1. Criação do perfil não-relacional no MongoDB
      const student = await StudentProfile.create({
        userId, 
        enderecoResidencial,
        tipoDeficiencia,
        necessidadesAcessibilidade,
        location,
      });

      // 2. Extrai o ObjectId gerado pelo MongoDB e converte para string
      const mongoProfileId = student._id.toString();

      // 3. Persistência relacional: Insere na tabela 'usuarios' do Supabase
      const { data: usuarioSupabase, error: supabaseError } = await supabase
        .from('usuarios')
        .insert([
          { 
            id: userId, // <-- ADICIONADO: O Supabase precisa da PK (geralmente o ID da auth)
            email: email, 
            mongo_profile_id: mongoProfileId 
          }
        ])
        .select()
        .single();

      // 4. O Rollback Manual (Segurança de Arquitetura)
      if (supabaseError) {
        await StudentProfile.findByIdAndDelete(student._id);
        
        return res.status(400).json({
          message: 'Erro de integridade relacional. Cadastro desfeito.',
          error: supabaseError.message,
        });
      }

      // 5. Sucesso absoluto nos dois bancos
      return res.status(201).json({
        message: "Estudante cadastrado com sucesso em ambos os bancos!",
        mongoData: student,
        supabaseData: usuarioSupabase
      });

    } catch (error: any) {
      return res.status(500).json({
        message: 'Erro interno ao cadastrar perfil do estudante.',
        error: error.message,
      });
    }
  }
  // Listar todos os estudantes (Mantido igual)
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

  // Buscar perfil por mongoId (Ajustado para o fluxo correto)
  static async getById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params; // Usando o _id do Mongo como parâmetro padrão
      const student = await StudentProfile.findById(id);

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

  static async proximos(req: Request, res: Response): Promise<Response> {
    try {
      const { lat, lng, raioKm } = req.query as unknown as GeoSearchQuery;
      const raioEmMetros = raioKm * 1000;
      const raioEmRadianos = raioEmMetros / 6378100;

      const students = await StudentProfile.find({
        location: {
          $geoWithin: {
            $centerSphere: [[lng, lat], raioEmRadianos],
          },
        },
      }).lean();

      const data = students.map((student) => toStudentGeoDTO(student as {
        _id: unknown;
        userId: string;
        tipoDeficiencia: string;
        necessidadesAcessibilidade: string;
        enderecoResidencial: string;
        location: {
          type: 'Point';
          coordinates: [number, number];
        };
      }));

      return res.status(200).json({
        count: data.length,
        data,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: 'Erro ao buscar estudantes próximos.',
        error: error.message,
      });
    }
  }
}