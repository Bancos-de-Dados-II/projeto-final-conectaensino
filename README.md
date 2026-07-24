# 📚 Conecta Ensino — Backend (API Node.js & MongoDB)

---

O **Conecta Ensino** é uma plataforma de impacto social voltada para a inclusão educacional, conectando estudantes a monitores voluntários para sessões de reforço escolar presencial.

Este repositório contém a infraestrutura do **backend**, responsável pela persistência de dados, suporte a dados geoespaciais e rotas da API REST.

---

## 🚀 Status do Projeto

- [x] **Configuração do Ambiente**: Node.js com TypeScript e `tsx` em modo de desenvolvimento.
- [x] **Variáveis de Ambiente**: Gerenciamento seguro com `dotenv`.
- [x] **Banco de Dados**: Conexão estável com **MongoDB Atlas** e fallback com DNS customizado (`8.8.8.8`) para resolver timeouts SRV em ambientes locais.
- [x] **Modelagem Mongoose**: Criação do schema `StudentProfile` com suporte a coordenadas **GeoJSON (Point)** e validações de dados.
- [x] **Validação e Persistência**: Teste de escrita e leitura em banco de dados validado com sucesso.
- [x] **Git & Segurança**: Definição de regras no `.gitignore` para proteção de credenciais e arquivos temporários.

---

## 🛠️ Tecnologias Utilizadas

- **Runtime**: Node.js
- **Linguagem**: TypeScript
- **Servidor HTTP**: Express
- **Execução/Reload**: `tsx`
- **Banco de Dados**: MongoDB Atlas
- **ODM (Object Data Modeling)**: Mongoose
- **Variáveis de Ambiente**: `dotenv`

---

## 📂 Estrutura do Projeto

```text
.
├── src/
│   ├── config/
│   │   └── mongo.ts              # Configuração da conexão com MongoDB Atlas e DNS
│   ├── models/
│   │   └── mongodb/
│   │       └── StudentProfile.ts # Schema e Model do Perfil do Estudante (GeoJSON)
│   ├── controllers/              # Controladores das rotas
│   └── server.ts                 # Ponto de entrada da aplicação Express
├── .env                          # Variáveis de ambiente (não versionado)
├── .env.example                  # Exemplo do arquivo de variáveis de ambiente
├── .gitignore                    # Arquivos ignorados pelo Git
├── package.json                  # Dependências e scripts do projeto
└── tsconfig.json                 # Configurações do TypeScript
```

---

## 🗄️ Modelagem de Dados (StudentProfile)

O modelo de perfil do estudante inclui suporte a consultas geoespaciais via **GeoJSON (2dsphere)** para localização de monitores e escolas próximas.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `userId` | String | Sim | Identificador do usuário |
| `enderecoResidencial` | String | Sim | Endereço completo do aluno |
| `tipoDeficiencia` | String | Sim | Tipo de deficiência (para acessibilidade) |
| `necessidadesAcessibilidade` | String | Não | Detalhes adicionais de acessibilidade |
| `location` | GeoJSON Point | Sim | Coordenadas `[Longitude, Latitude]` |

---

## ⚙️ Como Executar o Projeto

### 1. Pré-requisitos

- Node.js instalado (v18+)
- NPM, Yarn ou PNPM

### 2. Clonar o repositório e instalar dependências

```bash
git clone https://github.com/seu-usuario/conecta-ensino-backend.git
cd conecta-ensino-backend
npm install
```

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com base no `.env.example`:

```env
PORT=3000
MONGO_URI=mongodb+srv://<usuario>:<senha>@cluster0.jkc8xgh.mongodb.net/conecta_ensino?retryWrites=true&w=majority
```

### 4. Rodar o servidor em modo de desenvolvimento

```bash
npm run dev
```

O servidor estará rodando em:

```text
http://localhost:3000
```

---

## 📌 Próximos Passos

- [ ] Implementar rotas para cadastro de alunos e monitores pelas instituições.
- [ ] Criar endpoints de busca geoespacial (`$near`) baseados em coordenadas GeoJSON.
- [ ] Adicionar validação de payload das requisições com Zod.
- [ ] Configurar autenticação e autorização (JWT).
