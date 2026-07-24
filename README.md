# 🎓 Conecta Ensino — Backend Service

Plataforma de impacto social focada em inclusão educacional, conectando voluntários a estudantes para sessões de reforço escolar presencial, com suporte a localização geoespacial e governança por instituições de ensino.

---

## 🚀 Tecnologias Utilizadas

- **Runtime:** Node.js + TypeScript
- **Executor / Dev Tools:** `tsx` (Watch Mode)
- **Framework Web:** Express.js
- **Banco de Dados:** MongoDB (com suporte a índices `2dsphere` para GeoJSON)
- **ORM / ODM:** Mongoose
- **Validação de Schemas:** Zod
- **Containerização:** Docker & Docker Compose

---

## 📊 Arquitetura de Dados & Entidades

### 🏢 1. `Institution` (Instituição de Ensino)

Entidade de governança responsável pela administração dos cadastros.

**Campos:**

- `nome`
- `cnpj`
- `codigoInep`
- `diretorResponsavel` (`nome`, `email`, `telefone`)
- `endereco`
- `location` (`Point`)
- `ativa`

### 👨‍🏫 2. `MonitorProfile` (Monitor / Voluntário)

Perfil de monitoria associado a uma instituição cadastrada.

**Campos:**

- `userId`
- `institutionId` (referência para `Institution`)
- `disciplinas`
- `disponibilidade`
- `telefoneContato`
- `enderecoResidencial`
- `location` (`Point`)
- `ativo`

### 🎓 3. `Student` (Estudante)

Perfil do aluno assistido na plataforma.

**Campos:**

- `userId`
- `institutionId` (referência para `Institution`)
- `serieEscolar`
- `enderecoResidencial`
- `location` (`Point`)
- `ativo`

---

## 🔗 Endpoints da API

### 🏢 Instituições (`/api/institutions`)

| Método | Rota | Descrição |
| :---: | :--- | :--- |
| `POST` | `/api/institutions` | Cadastra uma nova instituição (validação com Zod). |
| `GET` | `/api/institutions` | Lista todas as instituições cadastradas. |
| `GET` | `/api/institutions/:id` | Obtém os detalhes de uma instituição específica. |

### 👨‍🏫 Monitores (`/api/monitors`)

| Método | Rota | Descrição |
| :---: | :--- | :--- |
| `POST` | `/api/monitors` | Cadastra um monitor vinculado a uma instituição. |
| `GET` | `/api/monitors` | Lista todos os monitores (com `populate` da instituição). |
| `GET` | `/api/monitors/:userId` | Busca um monitor pelo `userId`. |
| `GET` | `/api/monitors/institution/:institutionId` | Lista os monitores de uma instituição. |
| `GET` | `/api/monitors/nearby` | Busca monitores por proximidade utilizando `lng`, `lat` e `maxDistanceInMeters`. |

### 🎓 Estudantes (`/api/students`)

| Método | Rota | Descrição |
| :---: | :--- | :--- |
| `POST` | `/api/students` | Cadastra um estudante vinculado a uma instituição. |
| `GET` | `/api/students` | Lista todos os estudantes (com `populate` da instituição). |
| `GET` | `/api/students/:userId` | Busca um estudante pelo `userId`. |
| `GET` | `/api/students/institution/:institutionId` | Lista os estudantes pertencentes a uma instituição. |

---

## 🛠️ Como Executar o Projeto

### Pré-requisitos

- Node.js **v18** ou superior
- Docker e Docker Compose (para executar o MongoDB localmente)

### 1. Clonar o repositório e instalar as dependências

```bash
git clone <url-do-repositorio>
cd ConectaEnsino
npm install
```

### 2. Configurar as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/conecta_ensino
```

### 3. Subir o banco de dados com Docker

```bash
docker compose up -d
```

### 4. Iniciar a aplicação em modo de desenvolvimento

```bash
npm run dev
```

A API estará disponível em:

```text
http://localhost:3000
```

---

## 📍 Padrão GeoJSON Utilizado

Para requisições que utilizam localização geoespacial, envie o campo `location` no formato GeoJSON:

```json
{
  "location": {
    "type": "Point",
    "coordinates": [-38.563, -6.885]
  }
}
```

> **⚠️ Atenção:** No padrão GeoJSON utilizado pelo MongoDB, a ordem das coordenadas é sempre **[Longitude, Latitude]**.
>
> - **Longitude:** entre **-180** e **180**
> - **Latitude:** entre **-90** e **90**
