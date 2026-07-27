# 🎓 Conecta Ensino — Backend Service

Backend da plataforma Conecta Ensino, com foco em inclusão educacional, perfis geoespaciais, autenticação via Supabase Auth, persistência poliglota e geração de certificados em PDF.

O projeto usa MongoDB para perfis e dados operacionais, Supabase para autenticação e tabelas relacionais, e expõe uma API REST pronta para consumo por um front-end com mapas e fluxo de login.

## Stack

- Node.js
- TypeScript
- Express.js
- MongoDB com Mongoose
- Supabase Auth e Supabase Postgres
- Zod para validação
- PDFKit para geração de PDF em stream
- Vitest e Supertest para testes de integração
- Docker e Docker Compose para infraestrutura local

## Arquitetura de dados

O backend trabalha com duas camadas principais:

- MongoDB para perfis e entidades operacionais com localização geoespacial.
- Supabase para autenticação, vínculo relacional e tabelas compartilhadas com o front.

### Entidades MongoDB

- Institution: instituição de ensino com endereço e localização.
- StudentProfile: perfil do estudante com `location` em GeoJSON e índice `2dsphere`.
- MonitorProfile: perfil do monitor com `location` em GeoJSON e índice `2dsphere`.
- Session: sessão/aula solicitada entre aluno, monitor e disciplina.

### Tabelas Supabase

- usuarios
- disciplinas
- usuario_disciplina
- avaliacoes
- certificados

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/conecta_ensino
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-supabase
```

Se estiver usando outro Mongo local ou remoto, ajuste `MONGO_URI`.

## Como executar

### Pré-requisitos

- Node.js 18 ou superior
- Docker e Docker Compose, se quiser subir o Mongo localmente

### Instalação

```bash
npm install
```

### Subir infraestrutura local

```bash
docker compose up -d
```

### Rodar em desenvolvimento

```bash
npm run dev
```

### Rodar testes

```bash
npm test
```

## Auth e proteção de rotas

O login é feito via Supabase Auth, usando `signInWithPassword`.

### Login

- `POST /api/auth/login`

Body:

```json
{
  "email": "aluno@teste.com",
  "password": "senha-secreta"
}
```

A resposta retorna `access_token`, `refresh_token` e os dados básicos do usuário.

### Middleware JWT

O backend valida o header:

```http
Authorization: Bearer <token>
```

Esse token é validado no Supabase antes de a rota continuar. Quando válido, o usuário autenticado é injetado em `req.user`.

### Rotas protegidas

Estas rotas exigem token:

- `POST /api/students`
- `POST /api/monitors`
- `POST /api/disciplinas`
- `POST /api/disciplinas/vincular`
- `POST /api/sessoes/solicitar`
- `PATCH /api/sessoes/:id/status`
- `POST /api/certificados/gerar`
- `GET /api/certificados/:id/download`

## Geoespacial

O sistema suporta busca por proximidade para estudantes com campos `location` no padrão GeoJSON:

```json
{
  "location": {
    "type": "Point",
    "coordinates": [-38.563, -6.885]
  }
}
```

Importante:

- a ordem correta é `[longitude, latitude]`
- o índice `2dsphere` já está definido no schema do MongoDB

### Buscar estudantes próximos

- `GET /api/estudantes/proximos?lat=-6.89&lng=-38.56&raio=5`
- alias disponível: `GET /api/students/proximos?lat=-6.89&lng=-38.56&raio=5`

Parâmetros:

- `lat`: latitude entre -90 e 90
- `lng`: longitude entre -180 e 180
- `raio`: raio em km, opcional, padrão 10

A resposta retorna os perfis normalizados com `location: { type: 'Point', coordinates: [lng, lat] }` para facilitar o uso no Leaflet.

## Certificados em PDF

O backend gera o documento em memória e entrega diretamente por stream.

### Download

- `GET /api/certificados/:id/download`

O endpoint:

- busca o certificado no Supabase
- busca a disciplina associada
- valida autenticação via JWT
- monta o PDF com PDFKit
- devolve o arquivo com headers corretos para download

Headers de resposta:

- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="certificado-<id>.pdf"`

## Vínculo N:N

O vínculo entre usuários e disciplinas é registrado na tabela associativa `usuario_disciplina`.

### Criar vínculo

- `POST /api/disciplinas/vincular`

Body:

```json
{
  "usuario_id": "uuid-do-usuario",
  "disciplina_id": "uuid-da-disciplina"
}
```

O backend faz verificação prévia de integridade:

- retorna `404` se o usuário não existir
- retorna `404` se a disciplina não existir
- retorna `409` se o vínculo já existir

## Rotas da API

### Autenticação

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/api/auth/login` | Autentica via Supabase Auth e retorna tokens |

### Estudantes

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/api/students` | Cria perfil de estudante no Mongo e vínculo no Supabase |
| GET | `/api/students` | Lista estudantes |
| GET | `/api/students/:userId` | Busca estudante pelo id |
| GET | `/api/students/proximos` | Busca estudantes próximos por geolocalização |

Alias disponível:

| Método | Rota |
| --- | --- |
| GET | `/api/estudantes/proximos` |

### Monitores

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/api/monitors` | Cria perfil de monitor |
| GET | `/api/monitors` | Lista monitores |
| GET | `/api/monitors/:userId` | Busca monitor pelo id |
| GET | `/api/monitors/institution/:institutionId` | Lista monitores de uma instituição |
| GET | `/api/monitors/nearby` | Busca monitores próximos por geolocalização |

### Instituições

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/api/institutions` | Cria instituição |
| GET | `/api/institutions` | Lista instituições |
| GET | `/api/institutions/:id` | Busca instituição por id |

### Disciplinas

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/api/disciplinas` | Cria disciplina |
| GET | `/api/disciplinas` | Lista disciplinas |
| POST | `/api/disciplinas/vincular` | Cria vínculo usuário-disciplina |

### Sessões

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/api/sessoes/solicitar` | Solicita uma aula |
| PATCH | `/api/sessoes/:id/status` | Atualiza o status da sessão |

### Avaliações

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/api/avaliacoes` | Registra uma avaliação |

### Certificados

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/api/certificados/gerar` | Cria o registro do certificado no Supabase |
| GET | `/api/certificados/:id/download` | Gera e baixa o PDF do certificado |

## Testes de integração

A suíte usa Vitest + Supertest e não escreve em bancos reais.

Ela cobre:

- login via Supabase Auth
- bloqueio de rota sem token
- download de certificado em PDF binário
- vínculo N:N com validação de integridade

### Executar

```bash
npm test
```

## Observações importantes

- O backend já usa validação com Zod em pontos de entrada importantes.
- A busca geoespacial de estudantes e monitores usa `2dsphere` no MongoDB.
- O PDF é gerado em stream, sem criação de arquivo temporário no disco.
- O fluxo de teste foi isolado com mocks para manter a suíte segura e repetível.

## Exemplo rápido de uso

1. Faça login em `POST /api/auth/login`.
2. Use o `access_token` no header `Authorization: Bearer <token>`.
3. Crie perfis e vínculos nas rotas protegidas.
4. Baixe o certificado em `GET /api/certificados/:id/download`.
5. Busque perfis próximos em `GET /api/estudantes/proximos?lat=-6.89&lng=-38.56&raio=5`.
