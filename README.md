# 🎓 ConectaEnsino

> Plataforma de impacto social voltada para a inclusão educacional, conectando instituições de ensino, monitores voluntários e estudantes para sessões de reforço escolar presenciais com acompanhamento pedagógico integrado.

---

## 📖 Sobre o Projeto

O **ConectaEnsino** foi desenvolvido como projeto final utilizando uma arquitetura moderna baseada em **microsserviços**, **persistência poliglota** e aplicações web responsivas.

O objetivo da plataforma é facilitar o gerenciamento de monitorias, aproximando estudantes e monitores por meio de uma solução tecnológica que oferece agendamento de sessões, acompanhamento pedagógico, comunicação em tempo real e geolocalização de instituições de ensino.

O projeto possui foco inicial no estado da **Paraíba**, utilizando dados públicos para o mapeamento das instituições de ensino.

---

# ✨ Funcionalidades

- 🔐 Autenticação com diferentes níveis de acesso
  - Estudante
  - Monitor
  - Instituição/Diretor

- 🏫 Gestão de Instituições de Ensino

- 📅 Agendamento de monitorias

- 📚 Histórico de atendimentos

- 💬 Chat em tempo real

- 📍 Busca de instituições próximas

- 🗺️ Mapas interativos utilizando Leaflet

- 📊 Dashboard administrativo

- 📄 Geração de relatórios

- 🏅 Emissão automática de certificados

- ⚡ Cache utilizando Redis

---

# 🛠️ Tecnologias

## Back-end

- Node.js
- Express
- TypeScript
- MongoDB
- Mongoose
- PostgreSQL
- Supabase
- Redis
- Zod
- PDFKit
- Vitest
- Supertest

---

## Front-end

- React
- TypeScript
- Vite
- React Router DOM
- Tailwind CSS
- Axios
- React Leaflet
- Chart.js
- Lucide React
- jsPDF
- SheetJS (xlsx)

---

# 🗄️ Persistência Poliglota

O projeto utiliza três bancos de dados especializados:

| Tecnologia | Responsabilidade |
|------------|------------------|
| MongoDB | Chats, documentos e informações não estruturadas |
| PostgreSQL (Supabase) | Dados relacionais do sistema |
| Redis | Cache, sessões e otimização de desempenho |

---

# 📂 Estrutura do Projeto

```text
projeto-final-conectaensino
│
├── src
│   ├── config
│   ├── controllers
│   ├── middlewares
│   ├── models
│   ├── routes
│   ├── schemas
│   ├── scripts
│   ├── app.ts
│   └── server.ts
│
├── frontend
│   ├── src
│   └── package.json
│
├── escolas_pb_limpo.csv
├── package.json
├── tsconfig.json
└── README.md
```

## 🌐 Deploy

O **ConectaEnsino** está disponível online através do **Render**.

### 🚀 Back-end

API REST:

**https://projeto-final-conectaensino.onrender.com**

### 💻 Front-end

Aplicação Web:

**https://projeto-final-conectaensino-1.onrender.com**

---

# 🚀 Como Executar

## Pré-requisitos

- Node.js 18+
- npm
- MongoDB
- PostgreSQL (Supabase)
- Redis

---

## 1. Clone o projeto

```bash
git clone https://github.com/seu-usuario/projeto-final-conectaensino.git

cd projeto-final-conectaensino
```

---

## 2. Instale as dependências

```bash
npm install
```

---

## 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto utilizando o `.env.example` como base.

Exemplo:

```env
PORT=3000

MONGODB_URI=

SUPABASE_URL=

SUPABASE_ANON_KEY=

REDIS_URL=

JWT_SECRET=
```

---

## 4. Execute o Back-end

```bash
npm run dev
```

Servidor disponível em:

```
http://localhost:3000
```

## Documentacao da API

A documentacao Swagger fica disponivel em:

```text
http://localhost:3000/api/docs
```

---

## 5. Execute o Front-end

```bash
cd frontend

npm install

npm run dev
```

Aplicação disponível em:

```
http://localhost:5173
```

---

# 🧪 Testes

Executar todos os testes:

```bash
npm test
```

---

# 📜 Scripts

| Script | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o servidor em desenvolvimento |
| `npm run build` | Compila o projeto |
| `npm start` | Executa a versão compilada |
| `npm run typecheck` | Verifica os tipos do TypeScript |
| `npm test` | Executa os testes |
| `npm run seed:instituicoes` | Importa as instituições pelo CSV |

---

# 🏗️ Arquitetura

O projeto segue uma arquitetura baseada em camadas:

```text
Cliente (React)
        │
        ▼
Express API
        │
 ┌──────┼────────┐
 ▼      ▼        ▼
MongoDB PostgreSQL Redis
```

---

# 🌍 Funcionalidades Futuras

- Notificações em tempo real
- Aplicativo Mobile
- Integração com Google Maps
- Videochamadas para monitorias
- Sistema de recomendação de monitores
- IA para acompanhamento pedagógico

---

# 🤝 Contribuição

Contribuições são bem-vindas.

Caso encontre algum problema ou tenha sugestões de melhoria:

1. Faça um Fork
2. Crie uma Branch
3. Commit suas alterações
4. Abra um Pull Request

---

# 📄 Licença

Este projeto está licenciado sob a licença **MIT**.

Consulte o arquivo **LICENSE** para mais informações.

---

## 👨‍💻 Desenvolvido por

Projeto desenvolvido como Trabalho de disciplina por alunos do IFPB, com foco em promover inclusão educacional por meio da tecnologia.
