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
  endpoint: "/monitors",
  searchableFields: [
    "name",
    "nome",
    "email",
    "subject",
    "disciplina",
    "institution",
  ],
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
      placeholder: "monitor@exemplo.com",
      required: true,
    },
    {
      key: "subject",
      label: "Disciplina",
      placeholder: "Área de monitoria",
    },
    {
      key: "institution",
      label: "Instituição",
      placeholder: "Nome da instituição",
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
