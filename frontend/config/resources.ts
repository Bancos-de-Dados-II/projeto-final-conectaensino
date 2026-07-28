import type { CrudResourceConfig } from "../types/crud";

export const studentsResource: CrudResourceConfig = {
  title: "Alunos",
  description: "Gerencie os estudantes cadastrados na plataforma.",
  singular: "aluno",
  endpoint: "/students",
  searchableFields: ["name", "nome", "email", "institution", "instituicao"],
  fields: [
    {
      key: "name",
      label: "Nome",
      placeholder: "Nome completo",
      required: true,
    },
    {
      key: "email",
      label: "E-mail",
      type: "email",
      placeholder: "aluno@exemplo.com",
      required: true,
    },
    {
      key: "institution",
      label: "Instituição",
      placeholder: "Nome da instituição",
    },
    {
      key: "course",
      label: "Curso",
      placeholder: "Curso do aluno",
    },
  ],
};

export const monitorsResource: CrudResourceConfig = {
  title: "Monitores",
  description: "Cadastre e acompanhe os monitores disponíveis.",
  singular: "monitor",
  endpoint: "/monitors", // Alterado de "/api/monitors" para "/monitors"
  searchableFields: [
    "name",
    "email",
    "disciplinas",
    "telefoneContato",
    "enderecoResidencial",
  ],
  fields: [
    {
      key: "name",
      label: "Nome Completo",
      placeholder: "Nome do monitor",
      required: true,
    },
    {
      key: "email",
      label: "E-mail",
      type: "email",
      placeholder: "monitor@exemplo.com",
      required: true,
    },
    {
      key: "institutionId",
      label: "Instituição",
      type: "select",
      placeholder: "Selecione a instituição",
      required: true,
      // Se o seu EntityManager suporta carregar opções de uma API, mantenha. 
      // Caso contrário, se ele usa uma lista estática, preencha o array `options: [...]` com as escolas.
      optionsEndpoint: "/api/institutions", 
    },
    {
      key: "disciplinas",
      label: "Disciplinas",
      placeholder: "Ex: Matemática, Física",
      required: true,
    },
    {
      key: "disponibilidade",
      label: "Disponibilidade",
      placeholder: "Ex: Segunda Manhã, Terça Tarde",
      required: true,
    },
    {
      key: "telefoneContato",
      label: "Telefone de Contato",
      placeholder: "(83) 99999-9999",
    },
    {
      key: "enderecoResidencial",
      label: "Endereço Residencial",
      placeholder: "Rua Exemplo, 123",
      required: true,
    },
  ],
};

export const institutionsResource: CrudResourceConfig = {
  title: "Instituições",
  description: "Organize as instituições vinculadas ao Conecta Ensino.",
  singular: "instituição",
  endpoint: "/institutions",
  searchableFields: ["name", "nome", "city", "cidade", "email"],
  fields: [
    {
      key: "name",
      label: "Nome",
      placeholder: "Nome da instituição",
      required: true,
    },
    {
      key: "email",
      label: "E-mail",
      type: "email",
      placeholder: "contato@instituicao.com",
    },
    {
      key: "city",
      label: "Cidade",
      placeholder: "Cidade",
    },
    {
      key: "address",
      label: "Endereço",
      placeholder: "Endereço completo",
    },
  ],
};

export const subjectsResource: CrudResourceConfig = {
  title: "Disciplinas",
  description: "Gerencie as disciplinas oferecidas na plataforma.",
  singular: "disciplina",
  endpoint: "/disciplinas",
  searchableFields: ["name", "nome", "code", "codigo", "description"],
  fields: [
    {
      key: "name",
      label: "Nome",
      placeholder: "Nome da disciplina",
      required: true,
    },
    {
      key: "code",
      label: "Código",
      placeholder: "Ex.: ADS101",
    },
    {
      key: "workload",
      label: "Carga horária",
      type: "number",
      placeholder: "60",
    },
    {
      key: "description",
      label: "Descrição",
      type: "textarea",
      placeholder: "Resumo da disciplina",
    },
  ],
};
