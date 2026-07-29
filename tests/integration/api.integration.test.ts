import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../../src/app';

const supabaseMock = vi.hoisted(() => ({
  auth: {
    signInWithPassword: vi.fn(),
    getUser: vi.fn(),
  },
  from: vi.fn(),
}));

const monitorFindByIdMock = vi.hoisted(() => vi.fn());
const monitorFindMock = vi.hoisted(() => vi.fn());
const monitorAggregateMock = vi.hoisted(() => vi.fn());
const institutionFindMock = vi.hoisted(() => vi.fn());
const institutionFindByIdMock = vi.hoisted(() => vi.fn());

vi.mock('../../src/config/supabase', () => ({
  supabase: supabaseMock,
}));

vi.mock('../../src/models/mongodb/MonitorProfile', () => ({
  MonitorProfile: {
    find: (...args: unknown[]) => monitorFindMock(...args),
    aggregate: (...args: unknown[]) => monitorAggregateMock(...args),
    findById: (...args: unknown[]) => monitorFindByIdMock(...args),
  },
}));

vi.mock('../../src/models/mongodb/Institution', () => ({
  Institution: {
    find: (...args: unknown[]) => institutionFindMock(...args),
    findById: (...args: unknown[]) => institutionFindByIdMock(...args),
  },
}));

type TableResponse = {
  maybeSingle?: { data: unknown; error: null | { message: string; code?: string } };
  single?: { data: unknown; error: null | { message: string; code?: string } };
};

const tableResponses: Record<string, TableResponse> = {};

function resetTableResponses() {
  for (const key of Object.keys(tableResponses)) {
    delete tableResponses[key];
  }
}

function createQueryChain(table: string) {
  const chain = {
    select: () => chain,
    insert: () => chain,
    eq: () => chain,
    order: () => chain,
    maybeSingle: async () => {
      const response = tableResponses[table]?.maybeSingle;
      return response ?? { data: null, error: null };
    },
    single: async () => {
      const response = tableResponses[table]?.single;
      return response ?? { data: null, error: null };
    },
  };

  return chain;
}

function setTableResponse(table: string, response: TableResponse) {
  tableResponses[table] = response;
}

function buildPdfBufferParser() {
  return (res: any, callback: any) => {
    const chunks: Buffer[] = [];

    res.on('data', (chunk: Buffer) => chunks.push(chunk));
    res.on('end', () => callback(null, Buffer.concat(chunks)));
    res.on('error', (err: Error) => callback(err));
    res.resume();
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  resetTableResponses();

  supabaseMock.auth.signInWithPassword.mockResolvedValue({
    data: null,
    error: null,
  });

  supabaseMock.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: null,
  });

  supabaseMock.from.mockImplementation((table: string) => createQueryChain(table));

  monitorFindByIdMock.mockReturnValue({
    lean: vi.fn().mockResolvedValue({
      _id: 'monitor-1',
      userId: 'monitor-user-1',
      institutionId: 'inst-1',
      disciplinas: ['Matemática'],
      disponibilidade: [],
      telefoneContato: '11999999999',
      enderecoResidencial: 'Rua A, 100',
      location: { type: 'Point', coordinates: [-38.56, -6.89] },
      ativo: true,
    }),
  });

  monitorFindMock.mockReturnValue({
    populate: vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue([]),
    }),
  });
  monitorAggregateMock.mockResolvedValue([]);

  institutionFindMock.mockResolvedValue([]);
  institutionFindByIdMock.mockResolvedValue(null);
});

afterEach(() => {
  resetTableResponses();
});

describe('Fluxo de Autenticação e Sessão (Redis)', () => {
  let accessToken: string;

  // Substitua por um usuário válido e cadastrado no seu Supabase para o teste passar
  const credentials = {
    email: 'diretor1@email.com',
    password: 'diretor123',
  };

  it('1. Deve fazer login com sucesso, retornar o token e salvar no Redis', async () => {
    const response = await request(app)
      .post('/api/auth/login') // Ajuste a rota de login se necessário
      .send(credentials);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('access_token');
    
    // Salva o token para os próximos testes da suíte
    accessToken = response.body.access_token;
  });

  it('2. Deve acessar uma rota protegida usando o token armazenado no Redis', async () => {
    // Substitua '/api/profile' ou outra rota protegida real do seu sistema
    const response = await request(app)
      .get('/api/profile') 
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
  });

  it('3. Deve realizar o logout, invalidando a sessão no Redis', async () => {
    const response = await request(app)
      .post('/api/auth/logout') // Ajuste a rota de logout se necessário
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
  });

  it('4. Deve negar o acesso à rota protegida após o logout', async () => {
    const response = await request(app)
      .get('/api/profile') // Mesma rota protegida
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(401);
  });
});

describe('Fluxo de autenticação e rotas protegidas', () => {
  it('valida os campos obrigatórios no cadastro de aluno', async () => {
    const response = await request(app)
      .post('/api/auth/register/student')
      .send({
        email: 'aluno@teste.com',
        password: '123',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Erro na validação dos dados enviados.');
  });

  it('autentica via Supabase e retorna token JWT', async () => {
    supabaseMock.auth.signInWithPassword.mockResolvedValueOnce({
      data: {
        session: {
          access_token: 'jwt-token',
          refresh_token: 'refresh-token',
          token_type: 'bearer',
          expires_in: 3600,
        },
        user: {
          id: 'user-1',
          email: 'aluno@teste.com',
          role: 'authenticated',
          user_metadata: { full_name: 'Aluno Teste' },
        },
      },
      error: null,
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'aluno@teste.com', password: 'senha-secreta' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      access_token: 'jwt-token',
      refresh_token: 'refresh-token',
      token_type: 'bearer',
      expires_in: 3600,
      user: {
        id: 'user-1',
        email: 'aluno@teste.com',
      },
    });
  });

  it('bloqueia rota protegida sem token', async () => {
    const response = await request(app)
      .post('/api/monitors')
      .send({
        userId: 'user-1',
        email: 'aluno@teste.com',
        enderecoResidencial: 'Rua B, 200',
        tipoDeficiencia: 'nenhuma',
        location: { type: 'Point', coordinates: [-38.56, -6.89] },
      });

    expect(response.status).toBe(401);
    expect(supabaseMock.auth.getUser).not.toHaveBeenCalled();
  });

  it('impede que uma conta de aluno cadastre monitores', async () => {
    supabaseMock.auth.getUser.mockResolvedValueOnce({
      data: {
        user: {
          id: 'student-auth-id',
          email: 'aluno@teste.com',
          role: 'authenticated',
          user_metadata: { role: 'student', name: 'Aluno Teste' },
        },
      },
      error: null,
    });

    const response = await request(app)
      .post('/api/monitors')
      .set('Authorization', 'Bearer student-token')
      .send({});

    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      'Você não possui permissão para realizar esta ação.',
    );
  });
});

describe('Certificados em PDF', () => {
  it('retorna arquivo PDF binário para download', async () => {
    supabaseMock.auth.getUser.mockResolvedValueOnce({
      data: {
        user: {
          id: 'user-1',
          email: 'aluno@teste.com',
          role: 'authenticated',
          user_metadata: { full_name: 'Aluno Teste' },
        },
      },
      error: null,
    });

    setTableResponse('certificados', {
      maybeSingle: {
        data: {
          id: 'cert-1',
          mongo_monitor_id: 'monitor-mongo-id',
          disciplina_id: 'disc-1',
          horas_validadas: 20,
          emitido_em: '2026-07-26T10:00:00.000Z',
        },
        error: null,
      },
    });

    setTableResponse('disciplinas', {
      maybeSingle: {
        data: {
          id: 'disc-1',
          nome: 'Matemática',
          carga_horaria: 40,
        },
        error: null,
      },
    });

    const response = await request(app)
      .get('/api/certificados/cert-1/download')
      .set('Authorization', 'Bearer jwt-token')
      .buffer(true)
      .parse(buildPdfBufferParser());

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/pdf');
    expect(response.headers['content-disposition']).toContain('attachment; filename="certificado-cert-1.pdf"');
    expect(Buffer.isBuffer(response.body)).toBe(true);
    expect((response.body as Buffer).subarray(0, 4).toString()).toBe('%PDF');
  });
});

describe('Mapa com instituições do MongoDB', () => {
  it('retorna as instituições armazenadas na coleção institutions', async () => {
    institutionFindMock.mockResolvedValueOnce([
      {
        _id: 'institution-1',
        nome: 'Escola Municipal Teste',
        endereco: 'Rua Central, 100',
        location: {
          type: 'Point',
          coordinates: [-38.5612, -6.8897],
        },
        ativa: true,
      },
    ]);

    const response = await request(app).get('/api/institutions');

    expect(response.status).toBe(200);
    expect(institutionFindMock).toHaveBeenCalledWith({});
    expect(response.body).toEqual([
      expect.objectContaining({
        nome: 'Escola Municipal Teste',
        location: {
          type: 'Point',
          coordinates: [-38.5612, -6.8897],
        },
      }),
    ]);
  });

  it('busca somente escolas dentro do raio de 25 km', async () => {
    institutionFindMock.mockReturnValueOnce({
      lean: vi.fn().mockResolvedValue([
        {
          _id: 'institution-nearby',
          nome: 'Escola Próxima',
          location: {
            type: 'Point',
            coordinates: [-38.5612, -6.8897],
          },
          ativa: true,
        },
      ]),
    });
    monitorAggregateMock.mockResolvedValueOnce([
      { _id: 'institution-nearby', total: 2 },
    ]);

    const response = await request(app).get(
      '/api/institutions/nearby?lat=-6.8897&lng=-38.5612&radiusKm=25',
    );

    expect(response.status).toBe(200);
    expect(institutionFindMock).toHaveBeenCalledWith({
      ativa: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [-38.5612, -6.8897],
          },
          $maxDistance: 25000,
        },
      },
    });
    expect(response.body[0].monitorCount).toBe(2);
    expect(monitorAggregateMock).toHaveBeenCalledWith([
      {
        $match: {
          institutionId: { $in: ['institution-nearby'] },
        },
      },
      {
        $group: {
          _id: '$institutionId',
          total: { $sum: 1 },
        },
      },
    ]);
  });

  it('busca monitores disponíveis e indisponíveis em um raio de 25 km', async () => {
    const leanMock = vi.fn().mockResolvedValue([
      {
        _id: 'monitor-available',
        name: 'Monitor Disponível',
        ativo: true,
        location: { type: 'Point', coordinates: [-38.56, -6.89] },
      },
      {
        _id: 'monitor-unavailable',
        name: 'Monitor Indisponível',
        ativo: false,
        location: { type: 'Point', coordinates: [-38.57, -6.88] },
      },
    ]);
    const populateMock = vi.fn().mockReturnValue({ lean: leanMock });
    monitorFindMock.mockReturnValueOnce({ populate: populateMock });

    const response = await request(app).get(
      '/api/monitors/nearby?lat=-6.8897&lng=-38.5612&radiusKm=25',
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(monitorFindMock).toHaveBeenCalledWith({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [-38.5612, -6.8897],
          },
          $maxDistance: 25000,
        },
      },
    });
  });
});

describe('Vínculos N:N usuário-disciplina', () => {
  it('retorna 404 quando o usuário não existe e não insere vínculo', async () => {
    supabaseMock.auth.getUser.mockResolvedValueOnce({
      data: {
        user: {
          id: 'user-auth',
          email: 'auth@teste.com',
          role: 'authenticated',
          user_metadata: { full_name: 'Auth Teste' },
        },
      },
      error: null,
    });

    setTableResponse('usuarios', {
      maybeSingle: {
        data: null,
        error: null,
      },
    });

    const response = await request(app)
      .post('/api/disciplinas/vincular')
      .set('Authorization', 'Bearer jwt-token')
      .send({
        usuario_id: 'user-inexistente',
        disciplina_id: 'disc-1',
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Usuário não encontrado.');
    expect(supabaseMock.from).toHaveBeenCalledWith('usuarios');
    expect(supabaseMock.from).not.toHaveBeenCalledWith('usuario_disciplina');
  });

  it('cria vínculo quando usuário e disciplina existem', async () => {
    supabaseMock.auth.getUser.mockResolvedValueOnce({
      data: {
        user: {
          id: 'user-auth',
          email: 'auth@teste.com',
          role: 'authenticated',
          user_metadata: { full_name: 'Auth Teste' },
        },
      },
      error: null,
    });

    setTableResponse('usuarios', {
      maybeSingle: {
        data: { id: 'user-1' },
        error: null,
      },
    });

    setTableResponse('disciplinas', {
      maybeSingle: {
        data: { id: 'disc-1' },
        error: null,
      },
    });

    setTableResponse('usuario_disciplina', {
      single: {
        data: { usuario_id: 'user-1', disciplina_id: 'disc-1' },
        error: null,
      },
    });

    const response = await request(app)
      .post('/api/disciplinas/vincular')
      .set('Authorization', 'Bearer jwt-token')
      .send({
        usuario_id: 'user-1',
        disciplina_id: 'disc-1',
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      usuario_id: 'user-1',
      disciplina_id: 'disc-1',
    });
  });
});
