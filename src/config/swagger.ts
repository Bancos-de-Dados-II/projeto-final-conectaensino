const bearerAuth = [{ bearerAuth: [] }];

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'ConectaEnsino API',
    version: '1.0.0',
    description: 'Documentacao oficial da API REST do ConectaEnsino.',
  },
  servers: [{ url: '/api', description: 'Base da API' }],
  tags: [
    { name: 'Auth', description: 'Autenticacao e sessao' },
    { name: 'Profile', description: 'Perfil da conta' },
    { name: 'Students', description: 'Gestao de estudantes' },
    { name: 'Monitors', description: 'Gestao de monitores' },
    { name: 'Institutions', description: 'Gestao de instituicoes' },
    { name: 'Tasks', description: 'Atividades' },
    { name: 'System', description: 'Rotas auxiliares' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          access_token: { type: 'string' },
          refresh_token: { type: 'string' },
          token_type: { type: 'string' },
          expires_in: { type: 'number' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string', nullable: true },
            },
          },
        },
      },
      TaskStatusUpdate: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login com email e senha',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Login realizado com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' },
              },
            },
          },
          400: { description: 'Dados invalidos' },
          401: { description: 'Credenciais invalidas' },
        },
      },
    },
    '/auth/register/student': {
      post: {
        tags: ['Auth'],
        summary: 'Cadastrar estudante',
        responses: { 201: { description: 'Estudante cadastrado' } },
      },
    },
    '/auth/register/director': {
      post: {
        tags: ['Auth'],
        summary: 'Cadastrar diretor',
        responses: { 201: { description: 'Diretor cadastrado' } },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Encerrar sessao atual',
        security: bearerAuth,
        responses: { 200: { description: 'Logout realizado' } },
      },
    },
    '/profile': {
      get: {
        tags: ['Profile'],
        summary: 'Obter perfil autenticado',
        security: bearerAuth,
        responses: { 200: { description: 'Perfil carregado' } },
      },
      put: {
        tags: ['Profile'],
        summary: 'Atualizar perfil autenticado',
        security: bearerAuth,
        responses: { 200: { description: 'Perfil atualizado' } },
      },
    },
    '/profile/password': {
      patch: {
        tags: ['Profile'],
        summary: 'Atualizar senha da conta',
        security: bearerAuth,
        responses: { 200: { description: 'Senha atualizada' } },
      },
    },
    '/profile/security/password': {
      patch: {
        tags: ['Profile'],
        summary: 'Alterar senha com validação de seguranca',
        security: bearerAuth,
        responses: { 200: { description: 'Senha alterada' } },
      },
    },
    '/profile/security/revoke-sessions': {
      post: {
        tags: ['Profile'],
        summary: 'Revogar outras sessoes',
        security: bearerAuth,
        responses: { 200: { description: 'Sessoes revogadas' } },
      },
    },
    '/profile/security/account': {
      delete: {
        tags: ['Profile'],
        summary: 'Excluir conta',
        security: bearerAuth,
        responses: { 200: { description: 'Conta excluida' } },
      },
    },
    '/profile/avatar': {
      patch: {
        tags: ['Profile'],
        summary: 'Atualizar avatar',
        security: bearerAuth,
        responses: { 200: { description: 'Avatar atualizado' } },
      },
    },
    '/profile/institution': {
      patch: {
        tags: ['Profile'],
        summary: 'Atualizar instituicao vinculada',
        security: bearerAuth,
        responses: { 200: { description: 'Instituicao atualizada' } },
      },
    },
    '/students': {
      get: {
        tags: ['Students'],
        summary: 'Listar estudantes',
        security: bearerAuth,
        responses: { 200: { description: 'Lista de estudantes' } },
      },
      post: {
        tags: ['Students'],
        summary: 'Criar estudante',
        security: bearerAuth,
        responses: { 201: { description: 'Estudante criado' } },
      },
    },
    '/students/proximos': {
      get: {
        tags: ['Students'],
        summary: 'Buscar estudantes proximos',
        responses: { 200: { description: 'Estudantes encontrados' } },
      },
    },
    '/students/{id}': {
      get: {
        tags: ['Students'],
        summary: 'Buscar estudante por id',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Estudante encontrado' } },
      },
      put: {
        tags: ['Students'],
        summary: 'Atualizar estudante',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Estudante atualizado' } },
      },
      delete: {
        tags: ['Students'],
        summary: 'Excluir estudante',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Estudante excluido' } },
      },
    },
    '/students/{id}/profile': {
      get: {
        tags: ['Students'],
        summary: 'Obter perfil vinculado do estudante',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Perfil carregado' } },
      },
    },
    '/monitors': {
      get: {
        tags: ['Monitors'],
        summary: 'Listar monitores',
        security: bearerAuth,
        responses: { 200: { description: 'Lista de monitores' } },
      },
      post: {
        tags: ['Monitors'],
        summary: 'Criar monitor',
        security: bearerAuth,
        responses: { 201: { description: 'Monitor criado' } },
      },
    },
    '/monitors/nearby': {
      get: {
        tags: ['Monitors'],
        summary: 'Buscar monitores proximos',
        responses: { 200: { description: 'Monitores encontrados' } },
      },
    },
    '/monitors/me': {
      get: {
        tags: ['Monitors'],
        summary: 'Obter perfil do monitor autenticado',
        security: bearerAuth,
        responses: { 200: { description: 'Perfil carregado' } },
      },
      put: {
        tags: ['Monitors'],
        summary: 'Atualizar preferencias do monitor',
        security: bearerAuth,
        responses: { 200: { description: 'Perfil atualizado' } },
      },
      patch: {
        tags: ['Monitors'],
        summary: 'Atualizar avatar ou instituicao do monitor',
        security: bearerAuth,
        responses: { 200: { description: 'Perfil atualizado' } },
      },
    },
    '/monitors/institution/{institutionId}': {
      get: {
        tags: ['Monitors'],
        summary: 'Listar monitores por instituicao',
        parameters: [{ name: 'institutionId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Monitores listados' } },
      },
    },
    '/monitors/{userId}': {
      get: {
        tags: ['Monitors'],
        summary: 'Buscar monitor por usuario',
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Monitor encontrado' } },
      },
    },
    '/institutions': {
      get: {
        tags: ['Institutions'],
        summary: 'Listar instituicoes',
        responses: { 200: { description: 'Lista de instituicoes' } },
      },
      post: {
        tags: ['Institutions'],
        summary: 'Criar instituicao',
        responses: { 201: { description: 'Instituicao criada' } },
      },
    },
    '/institutions/nearby': {
      get: {
        tags: ['Institutions'],
        summary: 'Buscar instituicoes proximas',
        responses: { 200: { description: 'Instituicoes encontradas' } },
      },
    },
    '/institutions/{id}': {
      get: {
        tags: ['Institutions'],
        summary: 'Buscar instituicao por id',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Instituicao encontrada' } },
      },
    },
    '/tasks': {
      get: {
        tags: ['Tasks'],
        summary: 'Listar tarefas do aluno',
        security: bearerAuth,
        responses: { 200: { description: 'Lista de tarefas' } },
      },
      post: {
        tags: ['Tasks'],
        summary: 'Criar tarefa',
        security: bearerAuth,
        responses: { 201: { description: 'Tarefa criada' } },
      },
    },
    '/tasks/students': {
      get: {
        tags: ['Tasks'],
        summary: 'Listar estudantes do monitor',
        security: bearerAuth,
        responses: { 200: { description: 'Estudantes listados' } },
      },
    },
    '/tasks/{id}/status': {
      patch: {
        tags: ['Tasks'],
        summary: 'Atualizar status da tarefa',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TaskStatusUpdate' },
            },
          },
        },
        responses: { 200: { description: 'Status atualizado' } },
      },
    },
    '/teste-supabase': {
      get: {
        tags: ['System'],
        summary: 'Testar conexao com Supabase',
        responses: { 200: { description: 'Teste concluido' } },
      },
    },
    '/monitors/my-students': {
      get: {
        tags: ['System'],
        summary: 'Listar alunos do monitor a partir das sessoes',
        responses: { 200: { description: 'Alunos listados' } },
      },
    },
  },
} as const;