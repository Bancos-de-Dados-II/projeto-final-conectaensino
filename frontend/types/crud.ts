export type FieldType = "text" | "number" | "email" | "textarea" | "select";

export interface CrudField {
  key: string;
  label: string;
  type?: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string | number }[];
  optionsEndpoint?: string; // Endpoint para buscar dados dinâmicos, se o seu EntityManager suportar
}

export interface CrudEntity {
  id: string;
  [key: string]: unknown;
}

export interface CrudResourceConfig {
  title: string;
  description: string;
  singular: string;
  endpoint: string;
  fields: CrudField[];
  searchableFields: string[];
}
